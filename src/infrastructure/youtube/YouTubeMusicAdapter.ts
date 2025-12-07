import Innertube, {
  Constants,
  UniversalCache,
  Utils,
  YTNodes,
  type IPlayerResponse,
} from "youtubei.js";
import type {
  AudioStreamResult,
  SearchResult,
  YouTubeMusicClient,
} from "../../application/ports/YouTubeMusicClient.js";
import { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import type { VideoId } from "../../domain/value-object/VideoId.js";
import { BG, type BgConfig } from "bgutils-js";
import { JSDOM } from "jsdom";
import type { ReloadPlaybackContext } from "googlevideo/protos";
import { buildSabrFormat, EnabledTrackTypes } from "googlevideo/utils";
import { SabrStream } from "googlevideo/sabr-stream";
import { Artists } from "../../domain/value-object/Artists.js";
import { Album } from "../../domain/value-object/Album.js";
import { CoverArt } from "../../domain/value-object/CoverArt.js";

export class YouTubeMusicAdapter implements YouTubeMusicClient {
  private yt: Innertube;

  private constructor(innertube: Innertube) {
    this.yt = innertube;
  }

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
      cache: new UniversalCache(true),
    });

    return new YouTubeMusicAdapter(innertube);
  }

  async getTrackMetadata(videoId: VideoId): Promise<TrackMetadata> {
    const info = await this.yt.music.getInfo(videoId.value);

    const playlistPanel = info.tabs?.[0]
      ?.as(YTNodes.Tab)
      .content?.as(YTNodes.MusicQueue)
      .content?.as(YTNodes.PlaylistPanel);

    const firstVideo = playlistPanel?.contents?.[0]?.as(
      YTNodes.PlaylistPanelVideo
    );

    const artists = Artists.fromArray(
      firstVideo?.artists?.map((artist) => artist.name || "") ?? []
    );

    const album = Album.fromName(firstVideo?.album?.name);

    // Get high quality thumbnail
    const thumbnailUrl = info.basic_info.thumbnail?.[0]?.url || "";
    const coverArt = CoverArt.fromYouTubeThumbnail(thumbnailUrl);

    return TrackMetadata.create(
      firstVideo?.title.text || "",
      artists,
      album,
      firstVideo?.album?.year || "",
      coverArt
    );
  }

  async downloadAudio(videoId: VideoId): Promise<AudioStreamResult> {
    const webPoTokenResult = await this.generateWebPoToken(videoId.value);
    const playerResponse = await this.makePlayerRequest(videoId.value);

    // Now get the streaming information.
    const serverAbrStreamingUrl = await this.yt.session.player?.decipher(
      playerResponse.streaming_data?.server_abr_streaming_url
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
          ]
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
          reloadPlaybackContext
        );

        const serverAbrStreamingUrl = await this.yt.session.player?.decipher(
          playerResponse.streaming_data?.server_abr_streaming_url
        );
        const videoPlaybackUstreamerConfig =
          playerResponse.player_config?.media_common_config
            .media_ustreamer_request_config?.video_playback_ustreamer_config;

        if (serverAbrStreamingUrl && videoPlaybackUstreamerConfig) {
          serverAbrStream.setStreamingURL(serverAbrStreamingUrl);
          serverAbrStream.setUstreamerConfig(videoPlaybackUstreamerConfig);
        }
      }
    );

    // Start the stream and get the audio stream.
    const { audioStream, selectedFormats } = await serverAbrStream.start({
      audioQuality: "AUDIO_QUALITY_MEDIUM",
      enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY,
    });

    const bitrate = selectedFormats.audioFormat.bitrate
      ? `${Math.round(selectedFormats.audioFormat.bitrate / 1000)}k`
      : "128k";

    return {
      stream: Utils.streamToIterable(audioStream),
      bitrate,
    };
  }

  async search(query: string): Promise<SearchResult[]> {
    throw new Error("Method not implemented.");
  }

  getPlaylistTracks(playlistId: string): Promise<VideoId[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Fetches video details and streaming information from YouTube.
   * @param videoId The ID of the YouTube video.
   * @param reloadPlaybackContext Optional playback context for reloading.
   * @returns A promise that resolves to the player response.
   */
  private async makePlayerRequest(
    videoId: string,
    reloadPlaybackContext?: ReloadPlaybackContext
  ): Promise<IPlayerResponse> {
    const watchEndpoint = new YTNodes.NavigationEndpoint({
      watchEndpoint: { videoId },
    });

    const extraArgs: Record<string, any> = {
      playbackContext: {
        adPlaybackContext: { pyv: true },
        contentPlaybackContext: {
          vis: 0,
          splay: false,
          lactMilliseconds: "-1",
          signatureTimestamp: this.yt.session.player?.signature_timestamp,
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
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

    const dom = new JSDOM();

    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
    });

    const bgConfig: BgConfig = {
      fetch: (input: string | URL | globalThis.Request, init?: RequestInit) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(30 * 1000) }),
      globalObj: globalThis,
      identifier: contentBinding,
      requestKey: "O43z0dpjhgX20SCx4KAo",
    };

    const bgChallenge = await BG.Challenge.create(bgConfig);
    if (!bgChallenge) throw new Error("Could not get challenge");

    const interpreterJavascript =
      bgChallenge.interpreterJavascript
        .privateDoNotAccessOrElseSafeScriptWrappedValue;

    if (!interpreterJavascript) {
      throw new Error("Could not load VM");
    }

    // Execute the interpreter JavaScript in the global context.
    new Function(interpreterJavascript)();

    const poTokenResult = await BG.PoToken.generate({
      program: bgChallenge.program,
      globalName: bgChallenge.globalName,
      bgConfig,
    });

    // Generate the placeholder Po Token.
    const placeholderPoToken =
      BG.PoToken.generateColdStartToken(contentBinding);

    return {
      poToken: poTokenResult.poToken,
      visitorData: contentBinding,
      placeholderPoToken,
    };
  }
}
