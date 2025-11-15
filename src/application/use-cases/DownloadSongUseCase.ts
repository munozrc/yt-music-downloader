import { Song } from "../../domain/entity/Song.js";
import { SongUrl } from "../../domain/value-object/SongUrl.js";
import type { SongDownloader } from "../ports/SongDownloader.js";
import type { MetadataProvider } from "../ports/MetadataProvider.js";
import type { MetadataWriter } from "../ports/MetadataWriter.js";
import type { AudioConverter } from "../ports/AudioConverter.js";
import path from "node:path";

export class DownloadSongUseCase {
  constructor(
    private readonly audioConverter: AudioConverter,
    private readonly downloader: SongDownloader,
    private readonly metadataProvider: MetadataProvider,
    private readonly metadataWriter: MetadataWriter
  ) {}

  async execute(songUrl: string, outputFolder: string): Promise<Song> {
    const url = new SongUrl(songUrl);

    const [downloadResult, metadata] = await Promise.all([
      this.downloader.download(url),
      this.metadataProvider.getMetadata(url),
    ]);

    // Create song entity
    const song = new Song(crypto.randomUUID(), url, metadata);

    const outputFilePath = path.join(outputFolder, `${song.filename}.mp3`);
    const { tempFilePath, originalBitrate } = downloadResult;

    await this.audioConverter.convert({
      bitrate: originalBitrate,
      inputFilePath: tempFilePath,
      outputFilePath,
    });

    // Clean up temporary file
    await this.downloader.deleteTempFile(tempFilePath);

    // Write metadata to the downloaded file
    await this.metadataWriter.writeMetadata(outputFilePath, metadata);

    return song;
  }
}
