export interface FileSystemPort {
  createTempFile(prefix: string): string;
  writeStream(path: string): NodeJS.WritableStream;
  deleteFile(path: string): Promise<void>;
  ensureDirectory(path: string): Promise<void>;
}
