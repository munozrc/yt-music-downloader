import { join } from "node:path";

import { FfmpegConverter } from "../infrastructure/converter/FfmpegConverter.js";
import { logger } from "../infrastructure/logging/logger.js";
import { NodeId3Writer } from "../infrastructure/metadata/NodeId3Writer.js";
import { SharpImageProcessor } from "../infrastructure/converter/SharpImageProcessor.js";
import { YouTubeMusicAdapter } from "../infrastructure/youtube/YouTubeMusicAdapter.js";
import { iTunesEnricher } from "../infrastructure/metadata/iTunesEnricher.js";
import { SearchTrackUseCase } from "../application/use-cases/SearchTrackUseCase.js";
import { DownloadTrackUseCase } from "../application/use-cases/DownloadTrackUseCase.js";

export type AppContainer = {
  logger: typeof logger;
  searchTrackUseCase: SearchTrackUseCase;
  downloadTrackUseCase: DownloadTrackUseCase;
  defaultOutputFolder: string;
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

  // Use cases
  const searchTrackUseCase = new SearchTrackUseCase(
    youtubeClient,
    metadataEnricher
  );

  const downloadTrackUseCase = new DownloadTrackUseCase(
    youtubeClient,
    audioConverter,
    metadataWriter
  );

  const defaultOutputFolder = process.env.USERPROFILE
    ? join(process.env.USERPROFILE, "Music")
    : "";

  return {
    logger,
    searchTrackUseCase,
    downloadTrackUseCase,
    defaultOutputFolder,
  };
}
