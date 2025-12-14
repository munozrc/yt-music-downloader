import { VideoId } from "./VideoId.js";

export class YouTubeUrl {
  private constructor(public readonly value: string) {}

  static fromString(url: string): YouTubeUrl {
    if (!url.includes("music.youtube.com")) {
      throw new Error(
        "Invalid YouTube Music URL. Must be a music.youtube.com URL"
      );
    }
    return new YouTubeUrl(url);
  }

  extractVideoId(): VideoId {
    const urlParams = new URLSearchParams(new URL(this.value).search);
    const videoId = urlParams.get("v");

    if (!videoId) {
      throw new Error("Video ID not found in URL");
    }

    return VideoId.fromString(videoId);
  }

  hasPlaylist(): boolean {
    const urlParams = new URLSearchParams(new URL(this.value).search);
    return urlParams.has("list");
  }

  extractPlaylistId(): string | null {
    const urlParams = new URLSearchParams(new URL(this.value).search);
    return urlParams.get("list");
  }
}
