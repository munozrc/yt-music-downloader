import type { SongMetadata } from "../../domain/value-object/SongMetadata.js";

export interface AdditionalMetadataProvider {
  getMetadata(baseMetadata: SongMetadata): Promise<SongMetadata>;
}
