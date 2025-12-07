import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";

export interface MetadataWriter {
  writeMetadata(filePath: string, metadata: TrackMetadata): Promise<void>;
}
