import type { AdditionalMetadataProvider } from "../../application/ports/AdditionalMetadataProvider.js";
import { SongMetadata } from "../../domain/value-object/SongMetadata.js";
import { logger } from "../logging/logger.js";

interface TrackQuery {
  artists?: string[];
  title: string;
  durationMs?: number;
  year?: string;
}

export class iTunesMusicMetadataProvider implements AdditionalMetadataProvider {
  private readonly baseUrl = "https://itunes.apple.com/search";

  async getMetadata(baseMetadata: SongMetadata): Promise<SongMetadata> {
    const results = await this.searchTrack({
      title: baseMetadata.title,
      artists: baseMetadata.artists,
      year: baseMetadata.year,
    });

    const bestMetadataResult = this.pickBestTrack(results, {
      title: baseMetadata.title,
      artists: baseMetadata.artists,
      year: baseMetadata.year,
    });

    return new SongMetadata(
      baseMetadata.title,
      baseMetadata.artists,
      baseMetadata.album,
      baseMetadata.coverArtUrl,
      baseMetadata.year,
      bestMetadataResult?.primaryGenreName,
      bestMetadataResult?.trackNumber,
      bestMetadataResult?.trackCount,
      bestMetadataResult?.discCount,
      bestMetadataResult?.discNumber,
      bestMetadataResult?.releaseDate
    );
  }

  /**
   * Searches for tracks in the iTunes Music API based on the given query.
   * @param query - The track query containing title, artists, etc.
   * @returns A Promise that resolves to an array of track results.
   */
  private async searchTrack(query: TrackQuery): Promise<any[]> {
    try {
      const term = encodeURIComponent(
        `${query.title} ${query.artists?.join(" ") ?? ""}`.trim()
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
    } catch (error) {
      logger.warn("iTunes Music API search failed:", error);
      return [];
    }
  }

  /**
   * Picks the best matching track from the search results based on the query.
   * @param results - The array of track results from the iTunes Music API.
   * @param q - The track query containing title, artists, etc.
   * @returns The best matching track result or null if none found.
   */
  private pickBestTrack(results: any[], q: TrackQuery): any | null {
    if (!results.length) return null;

    const title = q.title.toLowerCase();
    const artists = (q.artists ?? []).map((a) => a.toLowerCase());

    let best = null;
    let bestScore = -Infinity;

    // Scoring mechanism
    for (const r of results) {
      let score = 0;

      const trackTitle = r.trackName?.toLowerCase() ?? "";
      const artistName = r.artistName?.toLowerCase() ?? "";

      // Exact title match
      if (trackTitle === title) score += 40;

      // Partial title match
      for (const a of artists) {
        if (artistName.includes(a)) score += 25;
      }

      // Duration match (within 5 seconds)
      if (q.durationMs && r.trackTimeMillis) {
        const diff = Math.abs(r.trackTimeMillis - q.durationMs);
        score += Math.max(0, 25 - diff / 1000);
      }

      // Year match
      if (q.year && r.releaseDate) {
        const ry = new Date(r.releaseDate).getFullYear();
        if (ry.toString() === q.year) score += 20;
        else score -= 10;
      }

      // Select best scoring track
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }

    return best;
  }
}
