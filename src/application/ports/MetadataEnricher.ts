import type { MetadataEnrichment } from "../../domain/value-object/MetadataEnrichment.js";
import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";

export interface MetadataEnricher {
  enrich(baseMetadata: TrackMetadata): Promise<MetadataEnrichment | null>;
}
