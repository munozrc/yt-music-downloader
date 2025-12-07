export class VideoId {
  private constructor(public readonly value: string) {}

  static fromString(id: string): VideoId {
    if (id.length !== 11) {
      throw new Error(`Invalid YouTube video ID: ${id}. Must be 11 characters`);
    }
    return new VideoId(id);
  }

  toString(): string {
    return this.value;
  }
}
