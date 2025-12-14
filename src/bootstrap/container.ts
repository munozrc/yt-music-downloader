import type { Logger } from "../application/ports/Logger.js";
import type { Presenter } from "../application/ports/Presenter.js";
import { TrackDownloadService } from "../application/services/TrackDownloadService.js";
import { DownloadPlaylistUseCase } from "../application/use-cases/DownloadPlaylistUseCase.js";
import { DownloadTrackUseCase } from "../application/use-cases/DownloadTrackUseCase.js";
import { SearchTrackUseCase } from "../application/use-cases/SearchTrackUseCase.js";
import { CliApplication } from "../infrastructure/cli/CliApplication.js";
import { DownloadCommand } from "../infrastructure/cli/commands/DownloadCommand.js";
import { SearchCommand } from "../infrastructure/cli/commands/SearchCommand.js";
import { InquirerPresenter } from "../infrastructure/cli/presenters/InquirerPresenter.js";
import { FfmpegConverter } from "../infrastructure/converter/FfmpegConverter.js";
import { SharpImageProcessor } from "../infrastructure/converter/SharpImageProcessor.js";
import { NodeFileSystemManager } from "../infrastructure/filesystem/NodeFileSystemManager.js";
import { logger } from "../infrastructure/logging/logger.js";
import { iTunesEnricher } from "../infrastructure/metadata/iTunesEnricher.js";
import { NodeId3Writer } from "../infrastructure/metadata/NodeId3Writer.js";
import { YouTubeMusicAdapter } from "../infrastructure/youtube/YouTubeMusicAdapter.js";

export type AppContainer = {
  cliApplication: CliApplication;
};

/**
 * Builds the application container with all necessary dependencies.
 * @returns A promise that resolves to the application container.
 */
export async function buildContainer(): Promise<AppContainer> {
  // Infrastructure adapters
  const imageProcessor = new SharpImageProcessor();
  const metadataEnricher = new iTunesEnricher();
  const youtubeClient = await YouTubeMusicAdapter.create();
  const metadataWriter = new NodeId3Writer(imageProcessor);
  const fileSystemManager = new NodeFileSystemManager();
  const audioConverter = new FfmpegConverter();

  // Presentation adapters
  const loggerAdapter: Logger = logger; // Adapter pattern
  const presenter: Presenter = new InquirerPresenter();

  // Output configuration
  const defaultOutputFolder = fileSystemManager.getDefaultMusicFolder();

  // Domain services
  const trackDownloadService = new TrackDownloadService(
    youtubeClient,
    audioConverter,
    metadataWriter,
    metadataEnricher,
    fileSystemManager,
    defaultOutputFolder
  );

  // Use cases
  const searchTrackUseCase = new SearchTrackUseCase(
    youtubeClient,
    loggerAdapter
  );

  const downloadTrackUseCase = new DownloadTrackUseCase(
    trackDownloadService,
    loggerAdapter
  );

  const downloadPlaylistUseCase = new DownloadPlaylistUseCase(
    youtubeClient,
    trackDownloadService,
    loggerAdapter
  );

  // CLI Commands
  const searchCommand = new SearchCommand(
    searchTrackUseCase,
    downloadTrackUseCase,
    presenter,
    loggerAdapter
  );

  const downloadCommand = new DownloadCommand(
    downloadTrackUseCase,
    downloadPlaylistUseCase,
    loggerAdapter
  );

  // CLI Application
  const cliApplication = new CliApplication(searchCommand, downloadCommand);

  return {
    cliApplication,
  };
}
