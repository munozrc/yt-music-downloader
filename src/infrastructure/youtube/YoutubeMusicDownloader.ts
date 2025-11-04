import { createWriteStream, unlink } from "node:fs";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

import ffmpegPath from "ffmpeg-static";
import { Utils } from "youtubei.js";

import type { Song } from "../../domain/Song.js";
import type { MusicDownloaderPort } from "../../ports/MusicDownloaderPort.js";
import { YoutubeClient } from "./YoutubeClient.js";

export class YoutubeMusicDownloader implements MusicDownloaderPort {
  private client: YoutubeClient;

  constructor(client: YoutubeClient) {
    this.client = client;
  }

  async download(songUrl: string, outputFolder: string): Promise<Song> {
    const { audioStream, selectedFormats } = await this.client.getAudioStream(
      this.client.extractVideoId(songUrl)
    );

    if (typeof ffmpegPath !== "string") {
      throw new Error("ffmpeg is not available on this system.");
    }

    console.log("Selected formats:", selectedFormats);

    const outputPath = join(
      outputFolder,
      `${this.client.extractVideoId(songUrl)}.mp3`
    );

    const tempFile = join(
      tmpdir(),
      `ytmusic_${randomBytes(8).toString("hex")}.webm`
    );

    const tempWrite = createWriteStream(tempFile, {
      flags: "w",
      encoding: "binary",
    });

    for await (const chunk of Utils.streamToIterable(audioStream)) {
      tempWrite.write(chunk);
    }

    const bitrate = selectedFormats.audioFormat.bitrate
      ? `${Math.round(selectedFormats.audioFormat.bitrate / 1000)}k`
      : "128k";

    const ffmpeg = spawn(ffmpegPath, [
      "-y",
      "-i",
      tempFile,
      "-vn",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      bitrate,
      outputPath,
    ]);

    const fileStream = createWriteStream(outputPath, {
      flags: "w",
      encoding: "binary",
    });

    await pipeline(ffmpeg.stdout, fileStream);
    unlink(tempFile, () => {});

    return {
      title: "Título",
      artist: "Artista",
      album: "Álbum",
      coverArtUrl: "http://example.com/cover.jpg",
    };
  }
}
