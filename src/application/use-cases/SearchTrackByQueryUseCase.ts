import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";

type SearchResult = {
  videoId: string;
  title: string;
  artists: string;
};

export class SearchTrackByQueryUseCase {
  constructor(private readonly youtubeClient: YouTubeMusicClient) {}

  async execute(queryString: string): Promise<SearchResult[]> {
    return this.youtubeClient.search(queryString);
  }
}
