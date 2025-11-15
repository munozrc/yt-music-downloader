import type {
  AudioConverter,
  AudioConvertParams,
} from "../../application/ports/AudioConverter.js";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";

export class FfmpegConverter implements AudioConverter {
  private ffmpegPath: string;

  constructor() {
    if (typeof ffmpegPath !== "string") {
      throw new Error("ffmpeg is not available on this system.");
    }

    // Set the ffmpegPath property
    this.ffmpegPath = ffmpegPath;
  }

  convert(params: AudioConvertParams): Promise<void> {
    const {
      inputFilePath,
      outputFilePath,
      bitrate = "128k",
      sampleRate = 44100,
      channels = 2,
      format = "mp3",
    } = params;

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
          resolve(); // Conversion successful
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
}
