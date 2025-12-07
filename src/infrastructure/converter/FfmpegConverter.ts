import { spawn } from "node:child_process";
import { unlink } from "node:fs/promises";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";

import type {
  AudioConverter,
  AudioConvertParams,
} from "../../application/ports/AudioConverter.js";

export class FfmpegConverter implements AudioConverter {
  private ffmpegPath: string;

  constructor() {
    if (typeof ffmpegPath !== "string") {
      throw new Error("ffmpeg is not available on this system.");
    }

    // Set the ffmpegPath property
    this.ffmpegPath = ffmpegPath;
  }

  /**
   * Converts an audio file using FFmpeg.
   * @param params Audio conversion parameters.
   * @returns A promise that resolves with the output file path.
   */
  convert(params: AudioConvertParams): Promise<string> {
    const {
      filename,
      outputFolder,
      inputFilePath,
      bitrate = "128k",
      sampleRate = 44100,
      channels = 2,
      format = "mp3",
    } = params;

    const outputFilePath = path.join(
      outputFolder,
      filename // with extension
    );

    const args = [
      "-y",
      "-i",
      inputFilePath,
      "-vn",
      "-ar",
      sampleRate.toString(),
      "-ac",
      channels.toString(),
      "-b:a",
      bitrate,
      "-f",
      format,
      outputFilePath,
    ];

    return new Promise((resolve, reject) => {
      // Spawn the FFmpeg process
      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = "";

      // Capture FFmpeg error output for debugging
      ffmpeg.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      // Handle process exit
      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(outputFilePath); // Conversion successful
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${errorOutput}`));
        }
      });

      // Handle process errors
      ffmpeg.on("error", (error) => {
        reject(error);
      });
    });
  }

  async deleteTemporaryFile(filePath: string): Promise<void> {
    await unlink(filePath);
  }
}
