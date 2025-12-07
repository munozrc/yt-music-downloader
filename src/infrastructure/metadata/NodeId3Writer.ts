import NodeID3 from "node-id3";

import type { ImageProcessor } from "../../application/ports/ImageProcessor.js";
import type { MetadataWriter } from "../../application/ports/MetadataWriter.js";
import type { CoverArt } from "../../domain/value-object/CoverArt.js";
import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import { logger } from "../logging/logger.js";

export class NodeId3Writer implements MetadataWriter {
  constructor(private readonly imageProcessor: ImageProcessor) {}

  /**
   * Writes ID3 metadata to the specified audio file.
   * @param filePath - The path to the audio file.
   * @param metadata - The TrackMetadata object containing metadata to write.
   */
  async writeMetadata(
    filePath: string,
    metadata: TrackMetadata
  ): Promise<void> {
    const tags: NodeID3.Tags = {
      title: metadata.title,
      artist: metadata.artists.toId3Format(),
      album: metadata.album.value,
      year: metadata.year,
      performerInfo: metadata.artists.primary,
      ...(metadata.genre ? { genre: metadata.genre } : {}),
      ...(metadata.trackNumber && metadata.trackCount
        ? { trackNumber: `${metadata.trackNumber}/${metadata.trackCount}` }
        : {}),
      ...(metadata.discNumber && metadata.discCount
        ? { partOfSet: `${metadata.discNumber}/${metadata.discCount}` }
        : {}),
      ...(metadata.releaseDate ? { date: metadata.releaseDate } : {}),
      ...(metadata.copyright ? { copyright: metadata.copyright } : {}),
    };

    // Add cover art if available
    if (metadata.coverArt.exists()) {
      try {
        const coverBuffer = await this.processArtwork(metadata.coverArt);
        tags.image = {
          mime: "image/jpeg",
          type: { id: 3, name: "front cover" },
          description: "Cover",
          imageBuffer: coverBuffer,
        };
      } catch (error) {
        logger.warn("Failed to process cover art:", error);
      }
    }

    // Write tags to file
    const success = NodeID3.write(tags, filePath);
    if (!success) {
      throw new Error("Failed to write metadata to file");
    }
  }

  /**
   * Processes the cover art by downloading and cropping if necessary.
   * @param coverArt - The CoverArt object containing the URL and cropping info.
   * @returns A Promise that resolves to a Buffer containing the processed image data.
   */
  private async processArtwork(coverArt: CoverArt): Promise<Buffer> {
    // If 16:9 video thumbnail, crop to square
    if (coverArt.requiresCropping()) {
      return this.imageProcessor.cropToSquare(coverArt.url);
    }

    // Otherwise just download
    const response = await fetch(coverArt.url, {
      signal: AbortSignal.timeout(30 * 1000),
    });

    if (!response.ok) {
      throw new Error(`Failed to download artwork: ${response.statusText}`);
    }

    // Return image as buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
