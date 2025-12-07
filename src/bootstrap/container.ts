import { join } from "node:path";

import { DownloadTrackUseCase } from "../application/use-cases/DownloadTrackUseCase.js";
import { SearchTrackUseCase } from "../application/use-cases/SearchTrackUseCase.js";
import { FfmpegConverter } from "../infrastructure/converter/FfmpegConverter.js";
import { SharpImageProcessor } from "../infrastructure/converter/SharpImageProcessor.js";
import { logger } from "../infrastructure/logging/logger.js";
import { iTunesEnricher } from "../infrastructure/metadata/iTunesEnricher.js";
import { NodeId3Writer } from "../infrastructure/metadata/NodeId3Writer.js";
import { YouTubeMusicAdapter } from "../infrastructure/youtube/YouTubeMusicAdapter.js";

export type AppContainer = {
  logger: typeof logger;
  searchTrackUseCase: SearchTrackUseCase;
  downloadTrackUseCase: DownloadTrackUseCase;
};

/**
 * Builds the application container with all necessary dependencies.
 * @returns A promise that resolves to the application container.
 */
export async function buildContainer(): Promise<AppContainer> {
  const imageProcessor = new SharpImageProcessor();
  const metadataEnricher = new iTunesEnricher();

  const youtubeClient = await YouTubeMusicAdapter.create();
  const metadataWriter = new NodeId3Writer(imageProcessor);
  const audioConverter = new FfmpegConverter();

  const defaultOutputFolder = process.env.USERPROFILE
    ? join(process.env.USERPROFILE, "Music")
    : "";

  // Use cases
  const searchTrackUseCase = new SearchTrackUseCase(
    youtubeClient,
    metadataEnricher
  );

  const downloadTrackUseCase = new DownloadTrackUseCase(
    youtubeClient,
    audioConverter,
    metadataWriter,
    defaultOutputFolder
  );

  return {
    logger,
    downloadTrackUseCase,
    searchTrackUseCase,
  };
}
