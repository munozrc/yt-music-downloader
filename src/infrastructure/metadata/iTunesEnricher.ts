import type { MetadataEnricher } from "../../application/ports/MetadataEnricher.js";
import { MetadataEnrichment } from "../../domain/value-object/MetadataEnrichment.js";
import { type TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import { logger } from "../logging/logger.js";

export class iTunesEnricher implements MetadataEnricher {
  private readonly baseUrl = "https://itunes.apple.com/search";

  /**
   * Enriches the given track metadata using the iTunes Music API.
   * @param baseMetadata - The base track metadata to enrich.
   * @returns A Promise that resolves to a MetadataEnrichment object or null if enrichment fails.
   */
  async enrich(
    baseMetadata: TrackMetadata
  ): Promise<MetadataEnrichment | null> {
    try {
      // Enrich metadata using iTunes API
      const results = await this.searchTrack(baseMetadata);
      const bestMatch = this.pickBestTrack(results, baseMetadata);

      // Return null if no results (e.g., unofficial tracks, remixes)
      return bestMatch ? MetadataEnrichment.fromITunes(bestMatch) : null;
    } catch (error) {
      logger.warn("iTunes enrichment failed:", error);
      return null; // Non-fatal, continue with base metadata
    }
  }

  /**
   * Searches for tracks on iTunes matching the given metadata.
   * @param metadata - The track metadata to search for.
   * @returns A Promise that resolves to an array of search results.
   */
  private async searchTrack(metadata: TrackMetadata): Promise<any[]> {
    const term = encodeURIComponent(
      `${metadata.title} ${metadata.artists.toString()}`.trim()
    );

    const res = await fetch(
      `${this.baseUrl}?term=${term}&entity=song&limit=25`,
      {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30 * 1000),
      }
    );

    const json = await res.json();
    return json.results ?? [];
  }

  /**
   * Picks the best matching track from the search results based on the given metadata.
   * @param results - The array of search results from iTunes.
   * @param metadata - The original track metadata to match against.
   * @returns The best matching track result or null if no suitable match is found.
   */
  private pickBestTrack(results: any[], metadata: TrackMetadata): any | null {
    if (!results.length) return null;

    const title = metadata.title.toLowerCase();
    const artists = metadata.artists.all.map((a) => a.toLowerCase());

    let best = null;
    let bestScore = -Infinity;

    for (const r of results) {
      let score = 0;

      const trackTitle = r.trackName?.toLowerCase() ?? "";
      const artistName = r.artistName?.toLowerCase() ?? "";

      // Exact title match
      if (trackTitle === title) score += 40;

      // Artist match
      for (const a of artists) {
        if (artistName.includes(a)) score += 25;
      }

      // Year match
      if (metadata.year && r.releaseDate) {
        const ry = new Date(r.releaseDate).getFullYear();
        if (ry.toString() === metadata.year) score += 20;
        else score -= 10;
      }

      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }

    return best;
  }
}
