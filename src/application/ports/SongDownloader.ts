import type { SongUrl } from "../../domain/value-object/SongUrl.js";
import type { DownloadResult } from "../dto/DownloadResult.js";

export interface SongDownloader {
  download(songUrl: SongUrl): Promise<DownloadResult>;
  deleteTempFile(filePath: string): Promise<void>;
}
