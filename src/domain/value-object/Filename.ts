import type { Artists } from "./Artists.js";

export class Filename {
  private constructor(private readonly value: string) {}

  static fromParts(artists: Artists, title: string): Filename {
    const artistsText = artists.toString();
    const name = `${artistsText} - ${title}`;
    return new Filename(name);
  }

  /**
   * Sanitizes filename for filesystem compatibility.
   * Replaces forbidden characters: / \ ? % * : | " < >
   */
  toFileSystem(): string {
    return this.value
      .replace(/[\/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  withExtension(ext: string = "mp3"): string {
    return `${this.toFileSystem()}.${ext}`;
  }

  toString(): string {
    return this.value;
  }
}
