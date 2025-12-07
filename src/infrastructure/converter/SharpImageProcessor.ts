import sharp from "sharp";

import type { ImageProcessor } from "../../application/ports/ImageProcessor.js";

export class SharpImageProcessor implements ImageProcessor {
  /**
   * Downloads an image from the given URL, crops it to a square centered on the image,
   * and resizes it to 1000x1000 pixels.
   * @param imageUrl - The URL of the image to process.
   * @returns A Promise that resolves to a Buffer containing the processed image data.
   */
  async cropToSquare(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl, {
      headers: { "Content-Type": "image/jpeg" },
      signal: AbortSignal.timeout(30 * 1000),
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // If width or height is missing, return the original image buffer
    if (!metadata.width || !metadata.height) {
      return imageBuffer;
    }

    // Crop to center square
    const size = Math.min(metadata.width, metadata.height);

    return image
      .extract({
        left: Math.floor((metadata.width - size) / 2),
        top: Math.floor((metadata.height - size) / 2),
        width: size,
        height: size,
      })
      .resize(1000, 1000, {
        kernel: sharp.kernel.lanczos3,
        fit: "cover",
      })
      .toBuffer();
  }

  /**
   * Resizes an image to the specified width and height.
   * @param imageBuffer - The buffer containing the original image data.
   * @param width - The desired width.
   * @param height - The desired height.
   * @returns A Promise that resolves to a Buffer containing the resized image data.
   */
  async resize(
    imageBuffer: Buffer,
    width: number,
    height: number
  ): Promise<Buffer> {
    return sharp(imageBuffer) // Create a sharp instance with the image buffer
      .resize(width, height, {
        kernel: sharp.kernel.lanczos3,
        fit: "cover",
      })
      .toBuffer();
  }
}
