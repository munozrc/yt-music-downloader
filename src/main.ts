import { buildContainer } from "./bootstrap/container.js";

const container = await buildContainer();

container.downloadSongUseCase
  .execute(
    "https://music.youtube.com/watch?v=nujn6wbr-e8",
    container.defaultOutputFolder
  )
  .then((song) => {
    console.log("Downloaded:", song);
  });
