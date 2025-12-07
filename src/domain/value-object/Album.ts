export class Album {
  private constructor(private readonly name: string) {}

  static fromName(name: string | undefined): Album {
    return new Album(name?.trim() || "");
  }

  static empty(): Album {
    return new Album("");
  }

  get value(): string {
    return this.name;
  }

  isEmpty(): boolean {
    return this.name.length === 0;
  }

  toString(): string {
    return this.name || "Unknown Album";
  }
}
