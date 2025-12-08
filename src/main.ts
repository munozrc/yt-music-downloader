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
    const {
      logger,
      searchTrackByQueryUseCase,
      searchTrackUseCase,
      downloadTrackUseCase,
    } = await buildContainer();

    try {
      const results = await searchTrackByQueryUseCase.execute(query);

      if (results.length === 0) {
        logger.info("No tracks found for the given query.");
        process.exit(0);
      }

      const choices = results.map((track, idx) => ({
        name: `${track.title} - ${track.artists}`,
        value: idx,
      }));

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

      logger.info(`Get metadata for: ${track.title} - ${track.artists}`);
      const { metadata, videoId } = await searchTrackUseCase.execute(
        `https://music.youtube.com/watch?v=${track.videoId}`
      );

      logger.info("Starting download...");
      const download = await downloadTrackUseCase.execute(videoId, metadata);

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
    const { logger, downloadTrackUseCase, searchTrackUseCase } =
      await buildContainer();

    try {
      logger.info(`Searching for track: ${url}`);
      const { metadata, videoId } = await searchTrackUseCase.execute(url);

      logger.info("Starting download...");
      const download = await downloadTrackUseCase.execute(videoId, metadata);

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
