export class SongUrl {
  constructor(public readonly value: string) {}

  public extractVideoId(): string {
    const urlParams = new URLSearchParams(new URL(this.value).search);
    return urlParams.get("v") || "";
  }
}
