import type { Download } from "../../domain/aggregate/Download.js";
import { YouTubeUrl } from "../../domain/value-object/YouTubeUrl.js";
import type { Logger } from "../ports/Logger.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";
import type { TrackDownloadService } from "../services/TrackDownloadService.js";

export class DownloadPlaylistUseCase {
  constructor(
    private readonly playlistClient: YouTubeMusicClient,
    private readonly trackDownloader: TrackDownloadService,
    private readonly logger: Logger,
  ) {}

  async execute(playlistUrl: string): Promise<Download[]> {
    const url = YouTubeUrl.fromString(playlistUrl);
    const playlistId = url.extractPlaylistId();

    // Validate playlist URL
    if (!url.hasPlaylist() || !playlistId) {
      throw new Error("Invalid playlist URL");
    }

    // Fetch playlist tracks
    const trackIds = await this.playlistClient.getPlaylistTracks(playlistId);
    this.logger.info(`Found ${trackIds.length} tracks in the playlist.`);

    if (trackIds.length === 0) {
      throw new Error("No tracks found in the playlist");
    }

    const downloads: Download[] = [];

    // Download each track in the playlist
    for (const trackId of trackIds) {
      const trackUrl = `https://music.youtube.com/watch?v=${trackId}`;
      this.logger.info(`Downloading track: ${trackUrl}`);

      // Download each track using the TrackDownloadService
      const download = await this.trackDownloader.downloadFromUrl(trackUrl);
      downloads.push(download);

      this.logger.success(
        `Track downloaded: ${download.filename.withExtension()}`,
      );
    }

    return downloads;
  }
}
