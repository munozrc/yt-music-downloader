#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";

import { buildContainer } from "./bootstrap/container.js";

const program = new Command();

program
  .name("yt-music-downloader")
  .description("CLI to download music from YouTube Music")
  .version("1.0.0");

program
  .command("search <query>")
  .description("Search for tracks on YouTube Music by query")
  .action(async (query) => {
    const { logger, searchTrackUseCase, downloadTrackUseCase } =
      await buildContainer();

    try {
      const { choices, results } = await searchTrackUseCase.execute(query);

      // Prompt user to select a track from the search results
      const { selected } = await inquirer.prompt([
        {
          type: "rawlist",
          name: "selected",
          message: "Select a track to download:",
          choices,
        },
      ]);

      const track = results[selected];
      if (!track) {
        logger.error("No track selected.");
        process.exit(1);
      }

      logger.info("Starting download...");
      const download = await downloadTrackUseCase.execute(
        `https://music.youtube.com/watch?v=${track.videoId}`
      );

      // Download completed
      logger.success(`Downloaded: ${download.filename.withExtension()}`);
      process.exit(0);
    } catch (error) {
      logger.error(
        "Error searching track:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program
  .command("download <url>")
  .description("Download a track by URL")
  .action(async (url) => {
    const { logger, downloadTrackUseCase } = await buildContainer();

    try {
      logger.info("Starting download...");
      const download = await downloadTrackUseCase.execute(url);

      // Download completed
      logger.success(`Downloaded: ${download.filename.withExtension()}`);
      process.exit(0);
    } catch (error) {
      logger.error(
        "Error downloading track:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse(process.argv);
