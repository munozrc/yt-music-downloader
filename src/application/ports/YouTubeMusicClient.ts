import type { TrackMetadata } from "../../domain/value-object/TrackMetadata.js";
import type { VideoId } from "../../domain/value-object/VideoId.js";

export interface AudioStreamResult {
  stream: AsyncGenerator<Uint8Array<ArrayBufferLike>, void, unknown>;
  bitrate: string;
}

export interface SearchResult {
  videoId: string;
  title: string;
  artists: string[];
  thumbnail: string;
}

export interface YouTubeMusicClient {
  getTrackMetadata(videoId: VideoId): Promise<TrackMetadata>;
  downloadAudio(videoId: VideoId): Promise<AudioStreamResult>;
  search(query: string): Promise<SearchResult[]>;
  getPlaylistTracks(playlistId: string): Promise<VideoId[]>;
}
