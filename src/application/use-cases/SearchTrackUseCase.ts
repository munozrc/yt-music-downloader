import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import type { VideoId } from "../../domain/value-object/VideoId.js";
import { YouTubeUrl } from "../../domain/value-object/YouTubeUrl.js";
import type { MetadataEnricher } from "../ports/MetadataEnricher.js";
import type { YouTubeMusicClient } from "../ports/YouTubeMusicClient.js";

export class SearchTrackUseCase {
  constructor(
    private readonly youtubeClient: YouTubeMusicClient,
    private readonly metadataEnricher: MetadataEnricher
  ) {}

  /**
   * Searches for a track by URL and retrieves enriched metadata.
   * @param urlString The YouTube Music track URL.
   * @returns The enriched track metadata.
   */
  async execute(
    urlString: string
  ): Promise<{ metadata: TrackMetadata; videoId: VideoId }> {
    // Extract video ID from the URL
    const url = YouTubeUrl.fromString(urlString);
    const videoId = url.extractVideoId();

    // Fetch base metadata and enrich it
    const baseMetadata = await this.youtubeClient.getTrackMetadata(videoId);
    const enrichment = await this.metadataEnricher.enrich(baseMetadata);

    // Merge base metadata with enrichment if available
    const fullMetadata = enrichment
      ? baseMetadata.withEnrichment(enrichment)
      : baseMetadata;

    return {
      metadata: fullMetadata,
      videoId,
    };
  }
}
