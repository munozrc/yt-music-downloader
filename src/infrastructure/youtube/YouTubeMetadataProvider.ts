import { YTNodes } from "youtubei.js";
import type { MetadataProvider } from "../../application/ports/MetadataProvider.js";
import { SongMetadata } from "../../domain/value-object/SongMetadata.js";
import type { SongUrl } from "../../domain/value-object/SongUrl.js";
import type { YouTubeClient } from "./YouTubeClient.js";
import type { AdditionalMetadataProvider } from "../../application/ports/AdditionalMetadataProvider.js";

export class YouTubeMetadataProvider implements MetadataProvider {
  constructor(
    private readonly yt: YouTubeClient,
    private readonly adicionalMetadataProvider: AdditionalMetadataProvider
  ) {}

  /**
   * Fetches song metadata from a YouTube Music URL.
   * @param url - The YouTube Music URL of the song.
   * @returns A Promise that resolves to a SongMetadata object containing the song's metadata.
   */
  async getMetadata(url: SongUrl): Promise<SongMetadata> {
    const info = await this.yt.client.music.getInfo(url.extractVideoId());

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
      .replace(/=w\d+-h\d+/, "=w1000-h1000")
      .replace(/-rwa$/, "");

    const baseMetadata = new SongMetadata(
      firstVideo?.title.text || "",
      artists,
      firstVideo?.album?.name || "",
      highQualityThumbnail || "",
      firstVideo?.album?.year || ""
    );

    return this.adicionalMetadataProvider.getMetadata(baseMetadata);
  }
}
