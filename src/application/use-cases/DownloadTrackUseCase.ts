import { Download } from "../../domain/aggregate/Download.js";
import type { Logger } from "../ports/Logger.js";
import type { TrackDownloadService } from "../services/TrackDownloadService.js";

export class DownloadTrackUseCase {
  constructor(
    private readonly trackDownloader: TrackDownloadService,
    private readonly logger: Logger
  ) {}

  async execute(urlString: string): Promise<Download> {
    this.logger.info("Initiating track download...");

    // Use the TrackDownloadService to download the track
    const download = await this.trackDownloader.downloadFromUrl(urlString);

    this.logger.success(
      `Track downloaded: ${download.filename.withExtension()}`
    );

    return download;
  }
}
