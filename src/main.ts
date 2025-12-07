#!/usr/bin/env node
import { buildContainer } from "./bootstrap/container.js";

async function main() {
  // Get the video URL from command line arguments
  const videoUrl = process.argv.slice(2).join(" ").trim();
  if (!videoUrl) {
    console.error("Error: Missing required URL argument.");
    process.exit(1);
  }

  // Build the application container
  const { logger, searchTrackUseCase, downloadTrackUseCase } =
    await buildContainer();

  try {
    logger.info(`Searching for track: ${videoUrl}`);
    const { metadata, videoId } = await searchTrackUseCase.execute(videoUrl);

    logger.info("Starting download...");
    const download = await downloadTrackUseCase.execute(videoId, metadata);

    logger.success(`Downloaded: ${download.filename.withExtension()}`);
    process.exit(0);
  } catch (error) {
    logger.error(
      "Error processing track:",
      error instanceof Error ? error.message : String(error)
    );

    process.exit(1);
  }
}

main();
