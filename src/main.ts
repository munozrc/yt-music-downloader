#!/usr/bin/env node
import { buildContainer } from "./bootstrap/container.js";

async function main() {
  // Get the video URL from command line arguments
  const videoUrl = process.argv.slice(2).join(" ").trim();
  if (!videoUrl) {
    console.error("The URL must be a YouTube Music URL.");
    process.exit(1);
  }

  const { defaultOutputFolder, downloadSongUseCase, logger } =
    await buildContainer();

  try {
    const result = await downloadSongUseCase.execute(
      videoUrl,
      defaultOutputFolder
    );

    logger.success("Download completed:", result.filename);
  } catch (error) {
    logger.error("Error downloading song:", error);
    process.exit(1);
  }
}

main();
