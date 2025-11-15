import type { SongMetadata } from "../../domain/value-object/SongMetadata.js";

export interface MetadataWriter {
  writeMetadata(filePath: string, metadata: SongMetadata): Promise<void>;
}
