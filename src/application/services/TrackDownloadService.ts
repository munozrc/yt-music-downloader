import { Download } from "../../domain/aggregate/Download.js";
import { OutputPath } from "../../domain/value-object/OutputPath.js";
import { YouTubeUrl } from "../../domain/value-object/YouTubeUrl.js";
import type { AudioConverter } from "../ports/AudioConverter.js";
import type { FileSystemManager } from "../ports/FileSystemManager.js";
import type { MetadataEnricher } from "../ports/MetadataEnricher.js";
import type { MetadataWriter } from "../ports/MetadataWriter.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";

export class TrackDownloadService {
  constructor(
    private readonly youtubeClient: YouTubeMusicClient,
    private readonly audioConverter: AudioConverter,
    private readonly metadataWriter: MetadataWriter,
    private readonly metadataEnricher: MetadataEnricher,
    private readonly fileSystemManager: FileSystemManager,
    private readonly outputFolder: string
  ) {}

  /**
   * Downloads a track from the given YouTube Music URL.
   * @param urlString The YouTube Music track URL.
   * @returns A Promise that resolves to the Download aggregate.
   */
  async downloadFromUrl(urlString: string): Promise<Download> {
    // Extract video ID from the URL
    const url = YouTubeUrl.fromString(urlString);
    const videoId = url.extractVideoId();

    // Fetch base metadata and enrich it
    const baseMetadata = await this.youtubeClient.getTrackMetadata(videoId);
    const enrichment = await this.metadataEnricher.enrich(baseMetadata);

    // Merge base metadata with enrichment if available
    const fullMetadata = enrichment
      ? baseMetadata.withEnrichment(enrichment)
      : baseMetadata;

    const outputPath = OutputPath.fromMetadata(
      this.outputFolder,
      fullMetadata.artists,
      fullMetadata.album
    );

    const targetDirectory = outputPath.getFullPath();
    await this.fileSystemManager.ensureDirectory(targetDirectory);

    // Create download aggregate and process the download
    const download = Download.create(fullMetadata);
    download.startDownloading();
    const audioFile = await this.youtubeClient.downloadAudio(videoId);
    download.setAudioFile(audioFile);

    const convertedFilePath = await this.audioConverter.convert({
      filename: download.filename.withExtension(),
      inputFilePath: audioFile.tempPath,
      bitrate: audioFile.bitrate.toString(),
      outputFolder: targetDirectory,
    });

    await this.audioConverter.deleteTemporaryFile(
      audioFile.tempPath // cleanup
    );

    // Write metadata to the converted file
    download.startWritingMetadata();
    await this.metadataWriter.writeMetadata(convertedFilePath, fullMetadata);

    // Mark download as complete
    download.complete(convertedFilePath);

    return download;
  }
}
