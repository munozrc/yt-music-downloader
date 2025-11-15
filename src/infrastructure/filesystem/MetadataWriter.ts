import NodeID3 from "node-id3";

export interface AudioMetadata {
  album: string;
  artist: string;
  coverArtUrl: string;
  genre?: string;
  title: string;
  year: string;
}

export class MetadataWriter {
  async writeToFile(filePath: string, metadata: AudioMetadata): Promise<void> {
    const tags: NodeID3.Tags = {
      album: metadata.album,
      artist: metadata.artist,
      genre: metadata.genre ?? "",
      title: metadata.title,
      year: metadata.year,
    };

    if (metadata.coverArtUrl) {
      try {
        const coverBuffer = await this.downloadImage(metadata.coverArtUrl);
        tags.image = {
          mime: "image/png",
          type: { id: 3, name: "front cover" },
          description: "Cover",
          imageBuffer: coverBuffer,
        };
      } catch (error) {
        console.warn("Failed to download cover art:", error);
      }
    }

    const success = NodeID3.write(tags, filePath);
    if (!success) {
      throw new Error("Failed to write metadata to file");
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
