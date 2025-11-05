import type { ReloadPlaybackContext } from "googlevideo/protos";
import {
  Innertube,
  UniversalCache,
  Platform,
  YTNodes,
  Constants,
} from "youtubei.js";
import type { IPlayerResponse, Types } from "youtubei.js";
import { BG, type BgConfig } from "bgutils-js";
import { JSDOM } from "jsdom";
import { SabrStream } from "googlevideo/sabr-stream";
import { buildSabrFormat, EnabledTrackTypes } from "googlevideo/utils";

Platform.shim.eval = async (
  data: Types.BuildScriptResult,
  env: Record<string, Types.VMPrimative>
) => {
  const properties = [];

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`);
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  }

  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};

export class YoutubeClient {
  private yt: Innertube;

  private constructor(innertube: Innertube) {
    this.yt = innertube;
  }

  static async initializeAndCreate(): Promise<YoutubeClient> {
    const innertube = await Innertube.create({
      cache: new UniversalCache(true),
    });

    return new YoutubeClient(innertube);
  }

  extractVideoId(url: string): string {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get("v") || "";
  }

  /** Retrieves video information for a given video ID.
   * @param videoId The ID of the YouTube video.
   * @returns A promise that resolves to the video information.
   */
  async getVideoInfo(videoId: string) {
    const info = await this.yt.music.getInfo(videoId);

    const playlistPanel = info.tabs?.[0]
      ?.as(YTNodes.Tab)
      .content?.as(YTNodes.MusicQueue)
      .content?.as(YTNodes.PlaylistPanel);

    const firstVideo = playlistPanel?.contents?.[0]?.as(
      YTNodes.PlaylistPanelVideo
    );

    const artists =
      firstVideo?.artists?.map((artist) => {
        return artist.name || "";
      }) ?? [];

    const highQualityThumbnail = info.basic_info.thumbnail?.[0]?.url
      .replace(/=w\d+-h\d+/, "=w1400-h1400")
      .replace(/-rwa$/, "");

    return {
      album: firstVideo?.album?.name,
      artists,
      coverArtUrl: highQualityThumbnail || "",
      title: firstVideo?.title.text || "",
      year: firstVideo?.album?.year,
    };
  }

  /** Retrieves the audio stream for a given video ID.
   * @param videoId The ID of the YouTube video.
   * @returns A promise that resolves to the audio stream and selected formats.
   */
  async getAudioStream(videoId: string) {
    const webPoTokenResult = await this.generateWebPoToken(videoId);
    const playerResponse = await this.makePlayerRequest(videoId);

    // Now get the streaming information.
    const serverAbrStreamingUrl = await this.yt.session.player?.decipher(
      playerResponse.streaming_data?.server_abr_streaming_url
    );
    const videoPlaybackUstreamerConfig =
      playerResponse.player_config?.media_common_config
        .media_ustreamer_request_config?.video_playback_ustreamer_config;

    if (!videoPlaybackUstreamerConfig) {
      throw new Error("ustreamerConfig not found");
    }
    if (!serverAbrStreamingUrl) {
      throw new Error("serverAbrStreamingUrl not found");
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
          videoId,
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

    return {
      audioStream,
      selectedFormats,
    };
  }

  /** Fetches video details and streaming information from YouTube.
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

  /** Generates a Web Po Token for YouTube requests.
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
        fetch(input, init),
      globalObj: globalThis,
      identifier: contentBinding,
      requestKey: "O43z0dpjhgX20SCx4KAo",
    };

    const bgChallenge = await BG.Challenge.create(bgConfig);
    if (!bgChallenge) {
      throw new Error("Could not get challenge");
    }

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
      visitorData: contentBinding,
      placeholderPoToken,
      poToken: poTokenResult.poToken,
    };
  }
}
