export class Bitrate {
  private constructor(readonly kbps: number) {}

  /**
   * Creates a Bitrate instance from a string like "128k" or "320k".
   * Validates that the bitrate is within acceptable range (64-320 kbps).
   */
  static fromString(value: string): Bitrate {
    const numeric = parseInt(value.replace(/k$/i, ""));

    if (isNaN(numeric)) {
      throw new Error(`Invalid bitrate format: ${value}`);
    }

    if (numeric < 64 || numeric > 320) {
      throw new Error(`Bitrate out of range (64-320): ${numeric}`);
    }

    return new Bitrate(numeric);
  }

  isHighQuality(): boolean {
    return this.kbps >= 256;
  }

  toString(): string {
    return `${this.kbps}k`;
  }
}
