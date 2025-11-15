import { buildSabrFormat, EnabledTrackTypes } from "googlevideo/utils";
import type { SongDownloader } from "../../application/ports/SongDownloader.js";
import type { SongUrl } from "../../domain/value-object/SongUrl.js";
import type { YouTubeClient } from "./YouTubeClient.js";
import { SabrStream } from "googlevideo/sabr-stream";
import { Constants, Utils } from "youtubei.js";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { createWriteStream, unlink } from "node:fs";
import { logger } from "../logging/logger.js";
import type { DownloadResult } from "../../application/dto/DownloadResult.js";

export class YouTubeSongDownloader implements SongDownloader {
  constructor(private readonly yt: YouTubeClient) {}

  async download(songUrl: SongUrl): Promise<DownloadResult> {
    const { audioStream, selectedFormats } = await this.getAudioStream(
      songUrl.extractVideoId()
    );

    const tempFilename = `yt_${randomBytes(8).toString("hex")}.webm`;
    const tempFilePath = join(tmpdir(), tempFilename);

    // Create a write stream to the temporary output file
    const tempWrite = createWriteStream(tempFilePath, {
      encoding: "binary",
      flags: "w",
    });

    // Write the audio stream to the temporary file
    for await (const chunk of Utils.streamToIterable(audioStream)) {
      tempWrite.write(chunk);
    }

    // Finalize the write stream
    tempWrite.end();

    const { audioFormat } = selectedFormats;

    // Determine original bitrate
    const originalBitrate = audioFormat.bitrate
      ? `${Math.round(audioFormat.bitrate / 1000)}k`
      : "128k";

    logger.info(`Duration (ms): ${audioFormat.approxDurationMs}`);
    logger.info(`Audio quality: ${audioFormat.audioQuality}`);
    logger.info(`Mime type: ${audioFormat.mimeType}`);
    logger.info(`Bitrate: ${originalBitrate}`);

    return {
      originalBitrate,
      tempFilePath,
    };
  }

  /**
   * Deletes a temporary file.
   * @param filePath The path of the temporary file to delete.
   * @returns A promise that resolves when the file is deleted.
   */
  async deleteTempFile(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      unlink(filePath, () => resolve());
    });
  }

  /** Retrieves the audio stream for a given video ID.
   * @param videoId The ID of the YouTube video.
   * @returns A promise that resolves to the audio stream and selected formats.
   */
  private async getAudioStream(videoId: string) {
    const webPoTokenResult = await this.yt.generateWebPoToken(videoId);
    const playerResponse = await this.yt.makePlayerRequest(videoId);

    // Now get the streaming information.
    const serverAbrStreamingUrl = await this.yt.client.session.player?.decipher(
      playerResponse.streaming_data?.server_abr_streaming_url
    );
    const videoPlaybackUstreamerConfig =
      playerResponse.player_config?.media_common_config
        .media_ustreamer_request_config?.video_playback_ustreamer_config;

    if (!videoPlaybackUstreamerConfig) {
      throw new Error("ustreamerConfig not found");
    }
    if (!serverAbrStreamingUrl) {
      throw new Error("serverAbrStreamingUrl not found");
    }

    // Build SABR formats from the player response.
    const sabrFormats =
      playerResponse.streaming_data?.adaptive_formats.map(buildSabrFormat) ||
      [];

    const serverAbrStream = new SabrStream({
      formats: sabrFormats,
      serverAbrStreamingUrl,
      videoPlaybackUstreamerConfig,
      poToken: webPoTokenResult.poToken,
      clientInfo: {
        clientName: parseInt(
          Constants.CLIENT_NAME_IDS[
            this.yt.client.session.context.client
              .clientName as keyof typeof Constants.CLIENT_NAME_IDS
          ]
        ),
        clientVersion: this.yt.client.session.context.client.clientVersion,
      },
    });

    // Handle player response reload events (e.g, when IP changes, or formats expire).
    serverAbrStream.on(
      "reloadPlayerResponse",
      async (reloadPlaybackContext) => {
        // Fetch a new player response with the provided playback context.
        const playerResponse = await this.yt.makePlayerRequest(
          videoId,
          reloadPlaybackContext
        );

        const serverAbrStreamingUrl =
          await this.yt.client.session.player?.decipher(
            playerResponse.streaming_data?.server_abr_streaming_url
          );
        const videoPlaybackUstreamerConfig =
          playerResponse.player_config?.media_common_config
            .media_ustreamer_request_config?.video_playback_ustreamer_config;

        if (serverAbrStreamingUrl && videoPlaybackUstreamerConfig) {
          serverAbrStream.setStreamingURL(serverAbrStreamingUrl);
          serverAbrStream.setUstreamerConfig(videoPlaybackUstreamerConfig);
        }
      }
    );

    // Start the stream and get the audio stream.
    const { audioStream, selectedFormats } = await serverAbrStream.start({
      audioQuality: "AUDIO_QUALITY_MEDIUM",
      enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY,
    });

    return {
      audioStream,
      selectedFormats,
    };
  }
}
