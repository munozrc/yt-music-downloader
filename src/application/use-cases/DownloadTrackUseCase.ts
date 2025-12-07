import path from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";

import { Download } from "../../domain/aggregate/Download.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";
import type { AudioConverter } from "../ports/AudioConverter.js";
import type { MetadataWriter } from "../ports/MetadataWriter.js";
import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import { YouTubeUrl } from "../../domain/value-object/YouTubeUrl.js";
import { AudioFile } from "../../domain/value-object/AudioFile.js";

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
    const { stream, bitrate } = await this.youtubeClient.downloadAudio(videoId);
    const tempFilePath = await this.saveStreamToTempFile(stream);

    const audioFile = AudioFile.create(tempFilePath, bitrate);
    download.setAudioFile(audioFile);

    // 6. Convert audio to MP3
    const outputFilePath = path.join(
      outputFolder,
      download.filename.withExtension()
    );

    await this.audioConverter.convert({
      inputFilePath: tempFilePath,
      outputFilePath,
      bitrate: audioFile.bitrate.toString(),
    });

    // Clean up temp file
    await unlink(tempFilePath);

    // 7. Write metadata with artwork
    download.startWritingMetadata();
    await this.metadataWriter.writeMetadata(outputFilePath, metadata);

    // 8. Complete download
    download.complete(outputFilePath);

    return download;
  }

  private async saveStreamToTempFile(
    streamIterable: AsyncGenerator<Uint8Array<ArrayBufferLike>, void, unknown>
  ): Promise<string> {
    const tempFilePath = path.join(
      tmpdir(),
      `yt_${randomBytes(8).toString("hex")}.webm`
    );

    const writeStream = createWriteStream(tempFilePath, {
      encoding: "binary",
      flags: "w",
    });

    // Write the audio stream to the temporary file
    for await (const chunk of streamIterable) {
      writeStream.write(chunk);
    }

    // Finalize the write stream
    writeStream.end();

    return tempFilePath;
  }
}
