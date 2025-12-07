export class Artists {
  private constructor(private readonly values: string[]) {}

  static fromArray(artists: string[]): Artists {
    const filtered = artists.filter((a) => a && a.trim().length > 0);
    return new Artists(filtered.length > 0 ? filtered : ["Unknown Artist"]);
  }

  static single(artist: string): Artists {
    return Artists.fromArray([artist]);
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
