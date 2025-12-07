import type { Album } from "./Album.js";
import type { Artists } from "./Artists.js";
import type { CoverArt } from "./CoverArt.js";
import type { MetadataEnrichment } from "./MetadataEnrichment.js";

export class TrackMetadata {
  constructor(
    readonly title: string,
    readonly artists: Artists,
    readonly album: Album,
    readonly year: string,
    readonly coverArt: CoverArt,
    readonly enrichment?: MetadataEnrichment
  ) {
    if (!title || title.trim().length === 0) {
      throw new Error("Track title cannot be empty");
    }
  }

  static create(
    title: string,
    artists: Artists,
    album: Album,
    year: string,
    coverArt: CoverArt
  ): TrackMetadata {
    return new TrackMetadata(title, artists, album, year, coverArt);
  }

  isComplete(): boolean {
    return (
      Boolean(this.title) && !this.artists.isEmpty() && this.coverArt.exists()
    );
  }

  requiresEnrichment(): boolean {
    return !this.enrichment || this.enrichment.isEmpty();
  }

  withEnrichment(enrichment: MetadataEnrichment): TrackMetadata {
    return new TrackMetadata(
      this.title,
      this.artists,
      this.album,
      this.year,
      this.coverArt,
      enrichment
    );
  }

  // Convenience getters
  get genre(): string | undefined {
    return this.enrichment?.genre;
  }

  get trackNumber(): number | undefined {
    return this.enrichment?.trackNumber;
  }

  get trackCount(): number | undefined {
    return this.enrichment?.trackCount;
  }

  get discNumber(): number | undefined {
    return this.enrichment?.discNumber;
  }

  get discCount(): number | undefined {
    return this.enrichment?.discCount;
  }

  get releaseDate(): string | undefined {
    return this.enrichment?.releaseDate;
  }

  get copyright(): string | undefined {
    return this.enrichment?.copyright;
  }
}
