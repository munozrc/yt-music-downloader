import type { Song } from "../domain/Song.js";

export interface MusicDownloaderPort {
  download(songUrl: string, outputFolder: string): Promise<Song>;
}
