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
   * Structure with album and year: baseFolder/Artist/Album (Year)
   * Structure with album no year: baseFolder/Artist/Album
   * Structure without album: baseFolder/Artist
   */
  static fromMetadata(
    baseFolder: string,
    artists: Artists,
    album: Album,
    year?: string
  ): OutputPath {
    const artistFolder = this.sanitizeFolder(artists.primary);

    // Only create album folder if album is valid and not empty
    let albumFolder: string | null = null;

    // Check if album is not empty
    if (!album.isEmpty()) {
      const albumName = album.value;

      // Include year in folder name if valid
      if (year && year.trim() !== "" && year !== "0") {
        albumFolder = this.sanitizeFolder(`${albumName} (${year.trim()})`);
      } else {
        albumFolder = this.sanitizeFolder(albumName);
      }
    }

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
