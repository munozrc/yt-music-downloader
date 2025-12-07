import { Download } from "../../domain/aggregate/Download.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";
import type { AudioConverter } from "../ports/AudioConverter.js";
import type { MetadataWriter } from "../ports/MetadataWriter.js";
import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import { YouTubeUrl } from "../../domain/value-object/YouTubeUrl.js";

export class DownloadTrackUseCase {
  constructor(
    private readonly youtubeClient: YouTubeMusicClient,
    private readonly audioConverter: AudioConverter,
    private readonly metadataWriter: MetadataWriter
  ) {}

  async execute(
    urlString: string,
    metadata: TrackMetadata,
    outputFolder: string
  ): Promise<Download> {
    const url = YouTubeUrl.fromString(urlString);
    const videoId = url.extractVideoId();

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
      outputFolder,
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
