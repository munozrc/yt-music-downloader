import { Download } from "../../domain/aggregate/Download.js";
import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import type { VideoId } from "../../domain/value-object/VideoId.js";
import type { AudioConverter } from "../ports/AudioConverter.js";
import type { MetadataWriter } from "../ports/MetadataWriter.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";

export class DownloadTrackUseCase {
  constructor(
    private readonly youtubeClient: YouTubeMusicClient,
    private readonly audioConverter: AudioConverter,
    private readonly metadataWriter: MetadataWriter,
    private readonly outputFolder: string
  ) {}

  /**
   * Downloads a track, converts it, and writes metadata.
   * @param videoId The video ID of the track to download.
   * @param metadata The metadata of the track.
   * @returns The completed download aggregate.
   */
  async execute(videoId: VideoId, metadata: TrackMetadata): Promise<Download> {
    // 4. Create download aggregate
    const download = Download.create(metadata);
    download.startDownloading();

    // 5. Download audio stream
    const audioFile = await this.youtubeClient.downloadAudio(videoId);
    download.setAudioFile(audioFile);

    // 6. Convert audio to MP3
    const convertedFilePath = await this.audioConverter.convert({
      filename: download.filename.withExtension(),
      inputFilePath: audioFile.tempPath,
      bitrate: audioFile.bitrate.toString(),
      outputFolder: this.outputFolder,
    });

    // Clean up temp file
    await this.audioConverter.deleteTemporaryFile(audioFile.tempPath);

    // 7. Write metadata with artwork
    download.startWritingMetadata();
    await this.metadataWriter.writeMetadata(convertedFilePath, metadata);

    // 8. Complete download
    download.complete(convertedFilePath);

    return download;
  }
}
