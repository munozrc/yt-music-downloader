export class MetadataEnrichment {
  constructor(
    readonly genre?: string,
    readonly trackNumber?: number,
    readonly trackCount?: number,
    readonly discNumber?: number,
    readonly discCount?: number,
    readonly releaseDate?: string,
    readonly copyright?: string
  ) {}

  /**
   * Creates a MetadataEnrichment instance from iTunes data.
   */
  static fromITunes(data: any): MetadataEnrichment {
    return new MetadataEnrichment(
      data.primaryGenreName,
      data.trackNumber,
      data.trackCount,
      data.discNumber,
      data.discCount,
      data.releaseDate,
      data.copyright
    );
  }

  isEmpty(): boolean {
    return !this.genre && !this.trackNumber && !this.releaseDate;
  }
}
