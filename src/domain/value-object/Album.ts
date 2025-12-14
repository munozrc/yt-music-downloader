import { capitalizeWords } from "../utils/stringUtils.js";

export class Album {
  private constructor(private readonly name: string) {}

  static fromName(name: string | undefined): Album {
    const trimmed = name?.trim() || "";
    const capitalized = trimmed ? capitalizeWords(trimmed) : "";
    return new Album(capitalized);
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
