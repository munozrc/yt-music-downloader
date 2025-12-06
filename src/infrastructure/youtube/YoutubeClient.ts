import type { ReloadPlaybackContext } from "googlevideo/protos";
import Innertube, {
  Platform,
  UniversalCache,
  YTNodes,
  type IPlayerResponse,
  type Types,
} from "youtubei.js";
import { BG, type BgConfig } from "bgutils-js";
import { JSDOM } from "jsdom";

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

export class YouTubeClient {
  private yt: Innertube;

  private constructor(innertube: Innertube) {
    this.yt = innertube;
  }

  /** Factory method to create an instance of YouTubeClient.
   * @returns A Promise that resolves to an instance of YouTubeClient.
   */
  static async create(): Promise<YouTubeClient> {
    const innertube = await Innertube.create({
      cache: new UniversalCache(true),
    });

    return new YouTubeClient(innertube);
  }

  /** Fetches video details and streaming information from YouTube.
   * @param videoId The ID of the YouTube video.
   * @param reloadPlaybackContext Optional playback context for reloading.
   * @returns A promise that resolves to the player response.
   */
  public async makePlayerRequest(
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
  public async generateWebPoToken(contentBinding: string) {
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

  get client(): Innertube {
    return this.yt;
  }
}
