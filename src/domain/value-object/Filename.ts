import type { Artists } from "./Artists.js";

export class Filename {
  private constructor(private readonly value: string) {}

  /**
   * Creates filename with track number if available
   * Format with track number: "01 - Song Title"
   * Format without track number: "Artist Name - Song Title"
   */
  static fromParts(
    artists: Artists,
    title: string,
    trackNumber?: number
  ): Filename {
    let name: string;

    if (trackNumber !== undefined && trackNumber > 0) {
      // Format: "01 - Song Title" or "001 - Song Title" (padded based on number)
      const paddedNumber = String(trackNumber).padStart(2, "0");
      name = `${paddedNumber} - ${title}`;
    } else {
      // Fallback format: "Artist Name - Song Title"
      const artistsText = artists.toString();
      name = `${artistsText} - ${title}`;
    }

    return new Filename(name);
  }

  /**
   * Sanitizes filename for filesystem compatibility.
   * Replaces forbidden characters: / \ ? % * : | " < >
   */
  toFileSystem(): string {
    return this.value
      .replace(/[/\\?%*:|"<>]/g, "-")
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
