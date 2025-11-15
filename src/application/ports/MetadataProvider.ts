import type { SongMetadata } from "../../domain/value-object/SongMetadata.js";
import type { SongUrl } from "../../domain/value-object/SongUrl.js";

export interface MetadataProvider {
  getMetadata(url: SongUrl): Promise<SongMetadata>;
}
