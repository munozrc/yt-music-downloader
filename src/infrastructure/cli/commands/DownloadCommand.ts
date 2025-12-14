import type { Command } from "commander";

import type { Logger } from "../../../application/ports/Logger.js";
import type { Presenter } from "../../../application/ports/Presenter.js";
import type { DownloadTrackUseCase } from "../../../application/use-cases/DownloadTrackUseCase.js";

export class DownloadCommand {
  constructor(
    private readonly downloadTrackUseCase: DownloadTrackUseCase,
    private readonly presenter: Presenter,
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
      .action((url: string) => this.execute(url));
  }

  /**
   * Executes the download command logic
   * @param url The YouTube Music URL to download
   */
  private async execute(url: string): Promise<void> {
    try {
      this.logger.info("Starting download...");
      const download = await this.downloadTrackUseCase.execute(url);

      this.presenter.showSuccess(
        `Downloaded: ${download.filename.withExtension()}`
      );
      process.exit(0);
    } catch (error) {
      this.presenter.showError(
        "Error downloading track",
        error instanceof Error ? error : new Error(String(error))
      );
      process.exit(1);
    }
  }
}
