import { Command } from "commander";

import type { DownloadCommand } from "./commands/DownloadCommand.js";
import type { SearchCommand } from "./commands/SearchCommand.js";

export class CliApplication {
  private readonly program: Command;

  constructor(
    private readonly searchCommand: SearchCommand,
    private readonly downloadCommand: DownloadCommand
  ) {
    this.program = new Command();
    this.configure();
  }

  private configure(): void {
    this.program
      .name("yt-music-downloader")
      .description("CLI to download music from YouTube Music")
      .version("1.0.0");

    // Register commands
    this.searchCommand.register(this.program);
    this.downloadCommand.register(this.program);
  }

  run(args: string[]): void {
    this.program.parse(args);
  }
}
