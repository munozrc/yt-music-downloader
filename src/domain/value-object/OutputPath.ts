import type { Album } from "./Album.js";
import type { Artists } from "./Artists.js";

export class OutputPath {
  private constructor(
    private readonly baseFolder: string,
    private readonly artistFolder: string,
    private readonly albumFolder: string | null
  ) {}

  /**
   * Creates an output path based on artist and album information
   * Structure with album: baseFolder/Artist/Album
   * Structure without album: baseFolder/Artist
   */
  static fromMetadata(
    baseFolder: string,
    artists: Artists,
    album: Album
  ): OutputPath {
    const artistFolder = this.sanitizeFolder(artists.primary);

    // Only create album folder if album is valid and not empty
    const albumFolder = album.isEmpty()
      ? null
      : this.sanitizeFolder(album.value);

    return new OutputPath(baseFolder, artistFolder, albumFolder);
  }

  /**
   * Sanitizes folder names for filesystem compatibility
   */
  private static sanitizeFolder(name: string): string {
    return name
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Returns the full path including all folders
   * Example with album: C:\Users\Music\Artist Name\Album Name
   * Example without album: C:\Users\Music\Artist Name
   */
  getFullPath(): string {
    const parts = [this.baseFolder, this.artistFolder];

    if (this.albumFolder) {
      parts.push(this.albumFolder);
    }

    return parts.join("/").replace(/\\/g, "/");
  }

  /**
   * Returns the artist folder name
   */
  getArtistFolder(): string {
    return this.artistFolder;
  }

  /**
   * Returns the album folder name if exists
   */
  getAlbumFolder(): string | null {
    return this.albumFolder;
  }

  /**
   * Checks if this path includes an album folder
   */
  hasAlbumFolder(): boolean {
    return this.albumFolder !== null;
  }

  toString(): string {
    return this.getFullPath();
  }
}
