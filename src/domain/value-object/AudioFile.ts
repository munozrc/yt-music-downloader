import { Bitrate } from "./Bitrate.js";

export class AudioFile {
  private constructor(
    readonly tempPath: string, // Path to the temporary audio file
    readonly bitrate: Bitrate
  ) {}

  static create(tempPath: string, bitrateStr: string): AudioFile {
    const bitrate = Bitrate.fromString(bitrateStr);
    return new AudioFile(tempPath, bitrate);
  }

  isHighQuality(): boolean {
    return this.bitrate.isHighQuality();
  }
}
