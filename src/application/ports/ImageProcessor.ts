export interface ImageProcessor {
  cropToSquare(imageUrl: string): Promise<Buffer>;
  resize(imageBuffer: Buffer, width: number, height: number): Promise<Buffer>;
}
