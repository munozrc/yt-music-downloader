import { AudioFile } from "../value-object/AudioFile.js";
import { Filename } from "../value-object/Filename.js";
import type { MetadataEnrichment } from "../value-object/MetadataEnrichment.js";
import { TrackMetadata } from "../value-object/TrackMetadata.js";

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "converting"
  | "writing_metadata"
  | "completed"
  | "failed";

export class Download {
  private constructor(
    readonly id: string,
    private _metadata: TrackMetadata,
    private _status: DownloadStatus,
    private _audioFile?: AudioFile,
    private _outputPath?: string,
    private _error?: Error
  ) {}

  static create(metadata: TrackMetadata): Download {
    return new Download(crypto.randomUUID(), metadata, "pending");
  }

  // State transitions
  startDownloading(): void {
    if (this._status !== "pending") {
      throw new Error(`Cannot start download from status: ${this._status}`);
    }
    this._status = "downloading";
  }

  setAudioFile(audioFile: AudioFile): void {
    if (this._status !== "downloading") {
      throw new Error("Must be downloading to set audio file");
    }
    this._audioFile = audioFile;
    this._status = "converting";
  }

  startWritingMetadata(): void {
    if (this._status !== "converting") {
      throw new Error("Must convert audio before writing metadata");
    }
    this._status = "writing_metadata";
  }

  enrichMetadata(enrichment: MetadataEnrichment): void {
    if (this._status === "completed") {
      throw new Error("Cannot enrich metadata of completed download");
    }
    this._metadata = this._metadata.withEnrichment(enrichment);
  }

  complete(outputPath: string): void {
    if (this._status !== "writing_metadata") {
      throw new Error("Must write metadata before completing");
    }

    if (!this._metadata.isComplete()) {
      throw new Error("Cannot complete download with incomplete metadata");
    }

    this._outputPath = outputPath;
    this._status = "completed";
  }

  fail(error: Error): void {
    this._error = error;
    this._status = "failed";
  }

  // Getters
  get status(): DownloadStatus {
    return this._status;
  }

  get metadata(): TrackMetadata {
    return this._metadata;
  }

  get audioFile(): AudioFile | undefined {
    return this._audioFile;
  }

  get outputPath(): string | undefined {
    return this._outputPath;
  }

  get error(): Error | undefined {
    return this._error;
  }

  get filename(): Filename {
    return Filename.fromParts(this._metadata.artists, this._metadata.title);
  }

  isCompleted(): boolean {
    return this._status === "completed";
  }

  isFailed(): boolean {
    return this._status === "failed";
  }
}
