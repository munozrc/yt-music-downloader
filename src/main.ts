import { DownloadSongService } from "./application/DownloadSongService.js";
import { YoutubeClient } from "./infrastructure/youtube/YoutubeClient.js";
import { YoutubeMusicDownloader } from "./infrastructure/youtube/YoutubeMusicDownloader.js";

const client = await YoutubeClient.initializeAndCreate();
const downloader = new YoutubeMusicDownloader(client);
const service = new DownloadSongService(downloader);

service
  .execute("https://music.youtube.com/watch?v=4NfN-bdwfLA")
  .then((song) => console.log("Descargado:", song));
