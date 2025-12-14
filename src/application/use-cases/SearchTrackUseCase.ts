import type { Logger } from "../ports/Logger.js";
import type {
  SearchResult,
  YouTubeMusicClient,
} from "../ports/YouTubeMusicClient.js";

export class SearchTrackUseCase {
  constructor(
    private readonly youtubeClient: YouTubeMusicClient,
    private readonly logger: Logger
  ) {}

  /**
   * Searches for tracks based on the provided query
   * @param query The search query
   * @return A list of search results
   */
  async execute(query: string): Promise<SearchResult[]> {
    const results = await this.youtubeClient.search(query);

    if (results.length === 0) {
      this.logger.info("No tracks found for the given query.");
      return [];
    }

    this.logger.info(`Found ${results.length} tracks`);
    return results;
  }
}
