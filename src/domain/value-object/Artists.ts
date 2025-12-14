import { capitalizeWords } from "../utils/stringUtils.js";

export class Artists {
  private constructor(private readonly values: string[]) {}

  static fromArray(artists: string[]): Artists {
    const filtered = artists
      .filter((a) => a && a.trim().length > 0)
      .map((artist) => capitalizeWords(artist.trim()));

    return new Artists(filtered.length > 0 ? filtered : ["Unknown Artist"]);
  }
  static fromString(artists: string): Artists {
    const parts = artists
      .split(/,|&/)
      .map((artist) => artist.trim())
      .filter((artist) => artist.length > 0);

    return Artists.fromArray(parts);
  }

  get primary(): string {
    return this.values[0] || "Unknown Artist";
  }

  get all(): readonly string[] {
    return [...this.values];
  }

  isEmpty(): boolean {
    return this.values.length === 0 || this.values[0] === "Unknown Artist";
  }

  toString(separator: string = ", "): string {
    return this.values.join(separator);
  }

  toId3Format(): string {
    return this.values.join("; ");
  }
}
