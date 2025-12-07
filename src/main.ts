#!/usr/bin/env node
import { buildContainer } from "./bootstrap/container.js";

async function main() {
  // Get the video URL from command line arguments
  const videoUrl = process.argv.slice(2).join(" ").trim();
  if (!videoUrl) {
    console.error("The URL must be a YouTube Music URL.");
    process.exit(1);
  }

  const {
    logger,
    searchTrackUseCase,
    downloadTrackUseCase,
    defaultOutputFolder,
  } = await buildContainer();

  try {
    const metadata = await searchTrackUseCase.execute(videoUrl);
    const download = await downloadTrackUseCase.execute(
      videoUrl,
      metadata,
      defaultOutputFolder
    );

    logger.success(`Downloaded: ${download.filename.withExtension()}`);
  } catch (error) {
    logger.error("Error finding track:", error);
    process.exit(1);
  }
}

main();
