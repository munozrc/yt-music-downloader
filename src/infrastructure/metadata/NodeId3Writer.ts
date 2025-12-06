import NodeID3 from "node-id3";
import type { MetadataWriter } from "../../application/ports/MetadataWriter.js";
import type { SongMetadata } from "../../domain/value-object/SongMetadata.js";
import { logger } from "../logging/logger.js";
import sharp from "sharp";

export class NodeId3Writer implements MetadataWriter {
  async writeMetadata(filePath: string, metadata: SongMetadata): Promise<void> {
    // Prepare ID3 tags
    const tags: NodeID3.Tags = {
      album: metadata.album,
      artist: metadata.artists.join("; "),
      ...(metadata.genre ? { genre: metadata.genre } : {}),
      ...(metadata.trackNumber && metadata.trackCount
        ? { trackNumber: `${metadata.trackNumber}/${metadata.trackCount}` }
        : {}),
      ...(metadata.discNumber && metadata.discCount
        ? { partOfSet: `${metadata.discNumber}/${metadata.discCount}` }
        : {}),
      ...(metadata.releaseDate ? { date: metadata.releaseDate } : {}),
      performerInfo: metadata.artists[0] ?? "Unknown Artist",
      title: metadata.title,
      year: metadata.year,
    };

    // Add cover art if available
    if (metadata.coverArtUrl) {
      try {
        const coverBuffer = await this.downloadImage(metadata.coverArtUrl);
        tags.image = this.createImageTag(coverBuffer);
      } catch (error) {
        logger.warn("Failed to download cover art:", error);
      }
    }

    // Write tags to the file
    const success = NodeID3.write(tags, filePath);
    if (!success) {
      throw new Error("Failed to write metadata to file");
    }
  }

  /**
   * Creates an image tag for ID3 metadata.
   * @param coverBuffer - The buffer containing the cover image data.
   * @returns An object representing the image tag.
   */
  private createImageTag(coverBuffer: Buffer) {
    return {
      mime: "image/jpg",
      type: { id: 3, name: "front cover" },
      description: "Cover",
      imageBuffer: coverBuffer,
    };
  }

  /**
   * Downloads an image from the given URL and returns it as a Buffer.
   * @param url - The URL of the image to download.
   * @returns A Promise that resolves to a Buffer containing the image data.
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const coverBuffer = Buffer.from(arrayBuffer);

    // Special handling for YouTube thumbnail images
    if (url.includes("https://i.ytimg.com")) {
      return await this.processCoverImage(coverBuffer);
    }

    return coverBuffer;
  }

  /**
   * Processes the cover image to ensure it is square and resized to 1000x1000 pixels.
   * @param imageBuffer - The buffer containing the original image data.
   * @returns A Promise that resolves to a Buffer containing the processed image data.
   */
  private async processCoverImage(
    imageBuffer: Buffer
  ): Promise<Buffer<ArrayBufferLike>> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      if (metadata.width && metadata.height) {
        // Determine the size of the square crop
        const size = Math.min(metadata.width, metadata.height);

        // Crop to center square (1:1 aspect ratio)
        return await image
          .extract({
            width: size,
            height: size,
            left: Math.floor((metadata.width - size) / 2),
            top: Math.floor((metadata.height - size) / 2),
          })
          .resize(1000, 1000, {
            kernel: sharp.kernel.lanczos3,
            fit: "cover",
          })
          .jpeg({ quality: 95 })
          .toBuffer();
      }
    } catch (error) {
      logger.warn("Failed to process YouTube cover art, using original");
    }

    return Promise.resolve(imageBuffer);
  }
}
