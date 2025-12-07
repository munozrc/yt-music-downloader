export class CoverArt {
  private constructor(
    readonly url: string,
    readonly width: number,
    readonly height: number
  ) {}

  /**
   * Creates a CoverArt instance from a YouTube thumbnail URL.
   * Optionally accepts width and height, defaulting to 0.
   */
  static fromYouTubeThumbnail(
    url: string,
    width: number = 0,
    height: number = 0
  ): CoverArt {
    // Enhance YouTube URLs to get higher quality
    const highQualityUrl = url
      .replace(/=w\d+-h\d+/, "=w1000-h1000")
      .replace(/-rwa$/, "");

    return new CoverArt(highQualityUrl, width, height);
  }

  /**
   * Returns the aspect ratio as a string like "16:9" or "4:3".
   * If width or height is zero, returns "unknown".
   */
  get aspectRatio(): string {
    // Calculate aspect ratio as a string like "16:9" or "4:3"
    if (this.width === 0 || this.height === 0) {
      return "unknown";
    }

    // Helper function to compute GCD
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(this.width, this.height);

    return `${this.width / divisor}:${this.height / divisor}`;
  }

  /**
   * Returns true if the cover art is square (width equals height).
   */
  isSquare(): boolean {
    return this.width === this.height;
  }

  /**
   * YouTube Music videos/unofficial tracks have 16:9 thumbnails.
   * Official songs have 1:1 square artwork.
   */
  requiresCropping(): boolean {
    return (
      this.aspectRatio === "16:9" || // Standard 16:9 aspect ratio
      this.url.includes("https://i.ytimg.com") // YouTube thumbnail URL
    );
  }

  exists(): boolean {
    return Boolean(this.url && this.url.length > 0);
  }
}
