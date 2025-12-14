import type { Command } from "commander";

import type { Logger } from "../../../application/ports/Logger.js";
import type { Presenter } from "../../../application/ports/Presenter.js";
import type { DownloadTrackUseCase } from "../../../application/use-cases/DownloadTrackUseCase.js";
import type { SearchTrackUseCase } from "../../../application/use-cases/SearchTrackUseCase.js";

export class SearchCommand {
  constructor(
    private readonly searchTrackUseCase: SearchTrackUseCase,
    private readonly downloadTrackUseCase: DownloadTrackUseCase,
    private readonly presenter: Presenter,
    private readonly logger: Logger
  ) {}

  /**
   * Registers the search command with the CLI program
   * @param program The CLI program
   */
  register(program: Command): void {
    program
      .command("search <query>")
      .description("Search for tracks on YouTube Music by query")
      .action((query: string) => this.execute(query));
  }

  /**
   * Executes the search command logic
   * @param query The search query
   */
  private async execute(query: string): Promise<void> {
    try {
      // Execute use case - pure business logic
      const results = await this.searchTrackUseCase.execute(query);

      if (results.length === 0) {
        this.presenter.showError("No tracks found.");
        process.exit(1);
      }

      // Present results to user - UI logic
      const selectedTrack = await this.presenter.selectTrack(results);

      if (!selectedTrack) {
        this.presenter.showError("No track selected.");
        process.exit(1);
      }

      // Download the selected track
      this.logger.info("Starting download...");
      const url = `https://music.youtube.com/watch?v=${selectedTrack.videoId}`;
      const download = await this.downloadTrackUseCase.execute(url);

      // Show success
      this.presenter.showSuccess(
        `Downloaded: ${download.filename.withExtension()}`
      );
      process.exit(0);
    } catch (error) {
      this.presenter.showError(
        "Error searching track",
        error instanceof Error ? error : new Error(String(error))
      );
      process.exit(1);
    }
  }
}
