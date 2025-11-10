import { DownloadSongService } from "./application/DownloadSongService.js";
import { FFmpegConverter } from "./infrastructure/filesystem/FFmpegConverter.js";
import { FileSystemManager } from "./infrastructure/filesystem/FileSystemManager.js";
import { MetadataWriter } from "./infrastructure/filesystem/MetadataWriter.js";
import { YoutubeClient } from "./infrastructure/youtube/YoutubeClient.js";
import { YoutubeMusicDownloader } from "./infrastructure/youtube/YoutubeMusicDownloader.js";

const client = await YoutubeClient.initializeAndCreate();
const converter = new FFmpegConverter();
const fileSystem = new FileSystemManager();
const metadataWriter = new MetadataWriter();

const downloader = new YoutubeMusicDownloader(
  client,
  fileSystem,
  converter,
  metadataWriter
);

const service = new DownloadSongService(downloader);

service
  .execute("https://music.youtube.com/watch?v=nujn6wbr-e8")
  .then((song) => console.log("Descargado:", song));
