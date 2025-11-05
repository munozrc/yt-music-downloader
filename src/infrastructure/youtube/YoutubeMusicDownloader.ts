import { join } from "node:path";
import { Utils } from "youtubei.js";

import type { Song } from "../../domain/Song.js";
import type { MusicDownloaderPort } from "../../ports/MusicDownloaderPort.js";
import { YoutubeClient } from "./YoutubeClient.js";
import type { FileSystemPort } from "../../ports/FileSystemPort.js";
import type { FFmpegConverter } from "../filesystem/FFmpegConverter.js";
import type {
  AudioMetadata,
  MetadataWriter,
} from "../filesystem/MetadataWriter.js";

export class YoutubeMusicDownloader implements MusicDownloaderPort {
  private client: YoutubeClient;
  private fileSystem: FileSystemPort;
  private converter: FFmpegConverter;
  private metadataWriter: MetadataWriter;

  constructor(
    client: YoutubeClient,
    fileSystem: FileSystemPort,
    converter: FFmpegConverter,
    metadataWriter: MetadataWriter
  ) {
    this.client = client;
    this.fileSystem = fileSystem;
    this.converter = converter;
    this.metadataWriter = metadataWriter;
  }

  async download(songUrl: string, outputFolder: string): Promise<Song> {
    const videoId = this.client.extractVideoId(songUrl);

    const [audioInfo, videoInfo] = await Promise.all([
      this.client.getAudioStream(videoId),
      this.client.getVideoInfo(videoId),
    ]);

    const { audioStream, selectedFormats } = audioInfo;

    const fileName = this.buildFileName(videoInfo.artists, videoInfo.title);

    const outputPath = join(outputFolder, fileName);
    const tempFile = this.fileSystem.createTempFile("ytmusic");

    const tempWrite = this.fileSystem.writeStream(tempFile);
    for await (const chunk of Utils.streamToIterable(audioStream)) {
      tempWrite.write(chunk);
    }
    tempWrite.end();

    await new Promise((resolve) => tempWrite.on("finish", resolve));

    const bitrate = selectedFormats.audioFormat.bitrate
      ? `${Math.round(selectedFormats.audioFormat.bitrate / 1000)}k`
      : "128k";

    // Convert with FFmpeg (without metadata)
    await this.converter.convertToMp3({
      inputPath: tempFile,
      outputPath,
      bitrate,
    });

    await this.fileSystem.deleteFile(tempFile);

    const metadata: AudioMetadata = {
      title: videoInfo.title,
      artist: videoInfo.artists.join("; "),
      album: videoInfo.album ?? "",
      coverArtUrl: videoInfo.coverArtUrl,
      year: videoInfo.year ?? "",
    };

    await this.metadataWriter.writeToFile(outputPath, metadata);

    return {
      album: metadata.album,
      artist: metadata.artist,
      coverArtUrl: metadata.coverArtUrl,
      title: metadata.title,
    };
  }

  private sanitizeFileName(text: string): string {
    return text
      .replace(/[\/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  private buildFileName(artists: string[], title: string): string {
    const artistsText = artists
      .map((artist) => this.sanitizeFileName(artist))
      .join(", ");

    const sanitizedTitle = this.sanitizeFileName(title);

    return `${artistsText} - ${sanitizedTitle}.mp3`;
  }
}
