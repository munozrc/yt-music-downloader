import type { SongMetadata } from "../value-object/SongMetadata.js";
import type { SongUrl } from "../value-object/SongUrl.js";

export class Song {
  constructor(
    readonly uuid: string,
    readonly url: SongUrl,
    readonly metadata: SongMetadata,
    readonly durationSeconds?: number
  ) {}

  /**
   * Generates a sanitized filename for the song based on its metadata.
   * Returns a string in the format "Artist1, Artist2 - Song Title"
   */
  public get filename(): string {
    const artistsText = this.sanitizeText(this.metadata.normalizedArtists);
    const sanitizedTitle = this.sanitizeText(this.metadata.title);

    // Example filename: "Artist1, Artist2 - Song Title"
    return `${artistsText} - ${sanitizedTitle}`;
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[\/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }
}
