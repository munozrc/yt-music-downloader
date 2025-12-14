import type { Command } from "commander";

import type { Logger } from "../../../application/ports/Logger.js";
import type { DownloadPlaylistUseCase } from "../../../application/use-cases/DownloadPlaylistUseCase.js";
import type { DownloadTrackUseCase } from "../../../application/use-cases/DownloadTrackUseCase.js";

export class DownloadCommand {
  constructor(
    private readonly downloadTrackUseCase: DownloadTrackUseCase,
    private readonly downloadPlaylistUseCase: DownloadPlaylistUseCase,
    private readonly logger: Logger
  ) {}

  /**
   * Registers the download command with the CLI program
   * @param program The CLI program
   */
  register(program: Command): void {
    program
      .command("download <url>")
      .description("Download a track by URL")
      .option("-p, --playlist", "The YouTube Music playlist URL to download")
      .action((url: string, options: { playlist?: string }) =>
        this.execute(url, options)
      );
  }

  /**
   * Executes the download command logic
   * @param url The YouTube Music URL to download
   */
  private async execute(
    url: string,
    options: { playlist?: string }
  ): Promise<void> {
    const isPlaylist = options.playlist ?? false;

    try {
      // Download single track
      if (!isPlaylist) {
        await this.downloadTrackUseCase.execute(url);
        process.exit(0);
      }

      // Download playlist
      await this.downloadPlaylistUseCase.execute(url);
      process.exit(0);
    } catch (error) {
      this.logger.error(
        isPlaylist
          ? "Failed to download playlist:"
          : "Failed to download track:",
        error instanceof Error ? error : new Error(String(error))
      );
      process.exit(1);
    }
  }
}
