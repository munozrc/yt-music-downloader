import path from "node:path";
import type { Song } from "../domain/Song.js";
import type { MusicDownloaderPort } from "../ports/MusicDownloaderPort.js";

export class DownloadSongService {
  constructor(private downloader: MusicDownloaderPort) {}

  async execute(songUrl: string): Promise<Song> {
    const outputFolder = path.join(process.env.USERPROFILE || "", "Music");
    return this.downloader.download(songUrl, outputFolder);
  }
}
