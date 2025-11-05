import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";

export interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
}

export class FFmpegConverter {
  private ffmpegPath: string;

  constructor() {
    if (typeof ffmpegPath !== "string") {
      throw new Error("ffmpeg is not available on this system.");
    }

    // Set the ffmpegPath property
    this.ffmpegPath = ffmpegPath;
  }

  /**
   * Converts an audio file to MP3 format using FFmpeg.
   * @param options - Conversion options including input/output paths and audio settings.
   * @returns A promise that resolves when the conversion is complete.
   */
  async convertToMp3(options: ConversionOptions): Promise<void> {
    const {
      inputPath,
      outputPath,
      bitrate = "128k",
      sampleRate = 44100,
      channels = 2,
    } = options;

    const args = [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ar",
      sampleRate.toString(),
      "-ac",
      channels.toString(),
      "-b:a",
      bitrate,
      "-f",
      "mp3",
      outputPath,
    ];

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(this.ffmpegPath, args);
      let errorOutput = "";

      ffmpeg.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${errorOutput}`));
        }
      });

      ffmpeg.on("error", (error) => {
        reject(error);
      });
    });
  }
}
