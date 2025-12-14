import { logger } from "../../infrastructure/logging/logger.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";

export class SearchTrackUseCase {
  constructor(private readonly youtubeClient: YouTubeMusicClient) {}

  async execute(query: string): Promise<{
    choices: { name: string; value: number }[];
    results: { videoId: string; title: string; artists: string }[];
  }> {
    const results = await this.youtubeClient.search(query);

    if (results.length === 0) {
      logger.info("No tracks found for the given query.");
      throw new Error("No tracks found");
    }

    const choices = results.map((track, idx) => ({
      name: `${track.title} - ${track.artists}`,
      value: idx,
    }));

    return {
      choices,
      results,
    };
  }
}
