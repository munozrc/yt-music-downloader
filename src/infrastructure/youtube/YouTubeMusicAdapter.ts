import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BG,
  buildURL,
  GOOG_API_KEY,
  USER_AGENT,
  type WebPoSignalOutput,
} from "bgutils-js";
import type { ReloadPlaybackContext } from "googlevideo/protos";
import { SabrStream } from "googlevideo/sabr-stream";
import { buildSabrFormat, EnabledTrackTypes } from "googlevideo/utils";
import { JSDOM } from "jsdom";
import Innertube, {
  Constants,
  type IPlayerResponse,
  UniversalCache,
  Utils,
  YTNodes,
} from "youtubei.js";

import type {
  SearchResult,
  YouTubeMusicClient,
} from "../../application/ports/YouTubeMusicClient.js";
import { Album } from "../../domain/value-object/Album.js";
import { Artists } from "../../domain/value-object/Artists.js";
import { AudioFile } from "../../domain/value-object/AudioFile.js";
import { CoverArt } from "../../domain/value-object/CoverArt.js";
import { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import { VideoId } from "../../domain/value-object/VideoId.js";

export class YouTubeMusicAdapter implements YouTubeMusicClient {
  private yt: Innertube;

  private constructor(innertube: Innertube) {
    this.yt = innertube;
  }

  /**
   * Factory method to create an instance of YouTubeMusicAdapter.
   * @returns A promise that resolves to a YouTubeMusicAdapter instance.
   */
  static async create(): Promise<YouTubeMusicAdapter> {
    // Setup eval shim for youtubei.js
    const { Platform } = await import("youtubei.js");

    Platform.shim.eval = async (data, env) => {
      const properties = [];
      if (env.n) properties.push(`n: exportedVars.nFunction("${env.n}")`);
      if (env.sig)
        properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
      const code = `${data.output}\nreturn { ${properties.join(", ")} }`;
      return new Function(code)();
    };

    const innertube = await Innertube.create({
      user_agent: USER_AGENT,
      cache: new UniversalCache(true),
      enable_session_cache: false,
    });

    return new YouTubeMusicAdapter(innertube);
  }

  /**
   * Retrieves metadata for a given track by its video ID.
   * @param videoId The ID of the YouTube video.
   * @returns A promise that resolves to the track metadata.
   */
  async getTrackMetadata(videoId: VideoId): Promise<TrackMetadata> {
    const info = await this.yt.music.getInfo(videoId.value);

    const playlistPanel = info.tabs?.[0]
      ?.as(YTNodes.Tab)
      .content?.as(YTNodes.MusicQueue)
      .content?.as(YTNodes.PlaylistPanel);

    const firstVideo = playlistPanel?.contents?.[0]?.as(
      YTNodes.PlaylistPanelVideo,
    );

    const artists = firstVideo?.artists?.length
      ? Artists.fromArray(firstVideo.artists.map((artist) => artist.name || ""))
      : Artists.fromString(firstVideo?.author || ""); // Fallback to author if no artists listed

    const album = Album.fromName(firstVideo?.album?.name);

    // Get high quality thumbnail
    const thumbnailUrl = info.basic_info.thumbnail?.[0]?.url || "";
    const coverArt = CoverArt.fromYouTubeThumbnail(thumbnailUrl);

    return TrackMetadata.create(
      firstVideo?.title.text || "",
      artists,
      album,
      firstVideo?.album?.year || "",
      coverArt,
    );
  }

  /**
   * Searches for music tracks based on a query.
   * @param query The search query string.
   * @returns A promise that resolves to an array of search results.
   */
  async search(query: string): Promise<SearchResult[]> {
    const results = await this.yt.music.search(query);

    // Navigate to the MusicShelf node containing the search results
    const musicShelf = results.contents?.[1]?.as(YTNodes.MusicShelf);
    const rawItems =
      musicShelf?.contents.as(YTNodes.MusicResponsiveListItem) ?? [];

    // Map raw items to SearchResult format
    const songs = rawItems.map((item) => {
      const artists = item.artists?.length
        ? item.artists.map((artist) => artist.name ?? "").join(", ")
        : (item.author?.name ?? "");

      return {
        title: item.title ?? "",
        artists,
        videoId: item.id ?? "",
      };
    });

    return songs
      .filter((song) => song.title !== "" && song.artists !== "")
      .slice(0, 5);
  }

  async getPlaylistTracks(playlistId: string): Promise<VideoId[]> {
    const results = await this.yt.music.getPlaylist(playlistId);
    const contents =
      results.contents?.as(YTNodes.MusicResponsiveListItem) ?? [];

    return contents
      .map((item) => item?.id || "")
      .filter((id) => id !== "")
      .map((id) => VideoId.fromString(id));
  }

  /**
   * Downloads the audio for a given video ID.
   * @param videoId The ID of the YouTube video.
   * @returns A promise that resolves to the downloaded audio file.
   */
  async downloadAudio(videoId: VideoId): Promise<AudioFile> {
    const webPoTokenResult = await this.generateWebPoToken(videoId.value);

    const playerResponse = await this.makePlayerRequest(
      videoId.value,
      webPoTokenResult.poToken,
    );

    // Now get the streaming information.
    const serverAbrStreamingUrl = await this.yt.session.player?.decipher(
      playerResponse.streaming_data?.server_abr_streaming_url,
    );
    const videoPlaybackUstreamerConfig =
      playerResponse.player_config?.media_common_config
        .media_ustreamer_request_config?.video_playback_ustreamer_config;

    if (!videoPlaybackUstreamerConfig || !serverAbrStreamingUrl) {
      throw new Error("Could not get streaming configuration");
    }

    // Build SABR formats from the player response.
    const sabrFormats =
      playerResponse.streaming_data?.adaptive_formats.map(buildSabrFormat) ||
      [];

    const serverAbrStream = new SabrStream({
      formats: sabrFormats,
      serverAbrStreamingUrl,
      videoPlaybackUstreamerConfig,
      poToken: webPoTokenResult.poToken,
      clientInfo: {
        clientName: parseInt(
          Constants.CLIENT_NAME_IDS[
            this.yt.session.context.client
              .clientName as keyof typeof Constants.CLIENT_NAME_IDS
          ],
        ),
        clientVersion: this.yt.session.context.client.clientVersion,
      },
    });

    // Handle player response reload events (e.g, when IP changes, or formats expire).
    serverAbrStream.on(
      "reloadPlayerResponse",
      async (reloadPlaybackContext) => {
        // Fetch a new player response with the provided playback context.
        const playerResponse = await this.makePlayerRequest(
          videoId.value,
          webPoTokenResult.poToken,
          reloadPlaybackContext,
        );

        const serverAbrStreamingUrl = await this.yt.session.player?.decipher(
          playerResponse.streaming_data?.server_abr_streaming_url,
        );
        const videoPlaybackUstreamerConfig =
          playerResponse.player_config?.media_common_config
            .media_ustreamer_request_config?.video_playback_ustreamer_config;

        if (serverAbrStreamingUrl && videoPlaybackUstreamerConfig) {
          serverAbrStream.setStreamingURL(serverAbrStreamingUrl);
          serverAbrStream.setUstreamerConfig(videoPlaybackUstreamerConfig);
        }
      },
    );

    // Start the stream and get the audio stream.
    const { audioStream, selectedFormats } = await serverAbrStream.start({
      audioQuality: "AUDIO_QUALITY_MEDIUM",
      enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY,
    });

    // Save the audio stream to a temporary file and return the AudioFile
    const tempFilename = `yt_${randomBytes(8).toString("hex")}.webm`;
    const tempFilePath = join(tmpdir(), tempFilename);

    // Create a write stream to the temporary output file
    const tempWrite = createWriteStream(tempFilePath, {
      encoding: "binary",
      flags: "w",
    });

    // Write the audio stream to the temporary file
    for await (const chunk of Utils.streamToIterable(audioStream)) {
      tempWrite.write(chunk);
    }

    // Finalize the write stream
    tempWrite.end();

    // Determine bitrate string
    const bitrate = selectedFormats.audioFormat.bitrate
      ? `${Math.round(selectedFormats.audioFormat.bitrate / 1000)}k`
      : "128k";

    // Return the AudioFile
    return AudioFile.create(tempFilePath, bitrate);
  }

  /**
   * Fetches video details and streaming information from YouTube.
   * @param videoId The ID of the YouTube video.
   * @param reloadPlaybackContext Optional playback context for reloading.
   * @returns A promise that resolves to the player response.
   */
  private async makePlayerRequest(
    videoId: string,
    contentPoToken?: string,
    reloadPlaybackContext?: ReloadPlaybackContext,
  ): Promise<IPlayerResponse> {
    const watchEndpoint = new YTNodes.NavigationEndpoint({
      watchEndpoint: { videoId },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extraArgs: Record<string, any> = {
      playbackContext: {
        contentPlaybackContext: {
          vis: 0,
          splay: false,
          lactMilliseconds: "-1",
          signatureTimestamp: this.yt.session.player?.signature_timestamp,
        },
      },
      serviceIntegrityDimensions: {
        poToken: contentPoToken,
      },
    };

    if (reloadPlaybackContext) {
      extraArgs.playbackContext.reloadPlaybackContext = reloadPlaybackContext;
    }

    return await watchEndpoint.call<IPlayerResponse>(this.yt.actions, {
      ...extraArgs,
      parse: true,
    });
  }

  /**
   * Generates a Web Po Token for YouTube requests.
   * @param contentBinding The content binding identifier.
   * @returns A promise that resolves to the Web Po Token result.
   */
  private async generateWebPoToken(contentBinding: string) {
    if (!contentBinding) {
      throw new Error("Could not get visitor data");
    }

    const dom = new JSDOM(
      '<!DOCTYPE html><html lang="en"><head><title></title></head><body></body></html>',
      {
        url: "https://www.youtube.com/",
        referrer: "https://www.youtube.com/",
        userAgent: USER_AGENT,
      },
    );

    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      location: dom.window.location,
      origin: dom.window.origin,
    });

    if (!Reflect.has(globalThis, "navigator")) {
      Object.defineProperty(globalThis, "navigator", {
        value: dom.window.navigator,
      });
    }

    const challengeResponse = await this.yt.getAttestationChallenge(
      "ENGAGEMENT_TYPE_UNBOUND",
    );

    if (!challengeResponse.bg_challenge) {
      throw new Error("Could not get challenge");
    }

    const interpreterUrl =
      challengeResponse.bg_challenge.interpreter_url
        .private_do_not_access_or_else_trusted_resource_url_wrapped_value;
    const bgScriptResponse = await fetch(`https:${interpreterUrl}`);
    const interpreterJavascript = await bgScriptResponse.text();

    if (interpreterJavascript) {
      new Function(interpreterJavascript)();
    } else {
      throw new Error("Could not load VM");
    }

    const botGuard = await BG.BotGuardClient.create({
      program: challengeResponse.bg_challenge.program,
      globalName: challengeResponse.bg_challenge.global_name,
      globalObj: globalThis,
    });

    const webPoSignalOutput: WebPoSignalOutput = [];
    const botGuardResponse = await botGuard.snapshot({ webPoSignalOutput });
    const requestKey = "O43z0dpjhgX20SCx4KAo";

    const integrityTokenResponse = await fetch(buildURL("GenerateIT", true), {
      method: "POST",
      headers: {
        "content-type": "application/json+protobuf",
        "x-goog-api-key": GOOG_API_KEY,
        "x-user-agent": "grpc-web-javascript/0.1",
        "user-agent": USER_AGENT,
      },
      body: JSON.stringify([requestKey, botGuardResponse]),
    });

    const response = (await integrityTokenResponse.json()) as unknown[];

    if (typeof response[0] !== "string") {
      throw new Error("Could not get integrity token");
    }

    const integrityTokenBasedMinter = await BG.WebPoMinter.create(
      { integrityToken: response[0] },
      webPoSignalOutput,
    );

    const contentPoToken =
      await integrityTokenBasedMinter.mintAsWebsafeString(contentBinding);

    return {
      poToken: contentPoToken,
      visitorData: contentBinding,
    };
  }
}
