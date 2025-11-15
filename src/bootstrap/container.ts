import { join } from "node:path";
import { DownloadSongUseCase } from "../application/use-cases/DownloadSongUseCase.js";
import { FfmpegConverter } from "../infrastructure/converter/FfmpegConverter.js";
import { logger } from "../infrastructure/logging/logger.js";
import { NodeId3Writer } from "../infrastructure/metadata/NodeId3Writer.js";
import { YouTubeMetadataProvider } from "../infrastructure/youtube/YouTubeMetadataProvider.js";
import { YouTubeSongDownloader } from "../infrastructure/youtube/YouTubeSongDownloader.js";
import { YouTubeClient } from "../infrastructure/youtube/YouTubeClient.js";

export type AppContainer = {
  logger: typeof logger;
  downloadSongUseCase: DownloadSongUseCase;
  defaultOutputFolder: string;
};

/**
 * Builds the application container with all necessary dependencies.
 * @returns A promise that resolves to the application container.
 */
export async function buildContainer(): Promise<AppContainer> {
  const yt = await YouTubeClient.create();

  const audioConverter = new FfmpegConverter();
  const metadataProvider = new YouTubeMetadataProvider(yt);
  const metadataWriter = new NodeId3Writer();
  const songDownloader = new YouTubeSongDownloader(yt);

  const defaultOutputFolder = process.env.USERPROFILE
    ? join(process.env.USERPROFILE, "Music")
    : "";

  return {
    logger,
    defaultOutputFolder,
    downloadSongUseCase: new DownloadSongUseCase(
      audioConverter,
      songDownloader,
      metadataProvider,
      metadataWriter
    ),
  };
}
