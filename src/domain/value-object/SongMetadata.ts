export class SongMetadata {
  constructor(
    readonly title: string,
    readonly artists: string[],
    readonly album: string,
    readonly coverArtUrl: string,
    readonly year: string,
    readonly genre?: string,
    readonly trackNumber?: number,
    readonly trackCount?: number,
    readonly discCount?: number,
    readonly discNumber?: number,
    readonly releaseDate?: string,
    readonly copyright?: string
  ) {}

  get normalizedArtists(): string {
    if (this.artists.length === 0) return "Unknown Artist";
    return this.artists.filter(Boolean).join(", ");
  }
}
