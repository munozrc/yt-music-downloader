import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWriteStream, unlink } from "node:fs";
import { mkdir } from "node:fs/promises";

import type { FileSystemPort } from "../../ports/FileSystemPort.js";

export class FileSystemManager implements FileSystemPort {
  createTempFile(prefix: string): string {
    return join(tmpdir(), `${prefix}_${randomBytes(8).toString("hex")}.webm`);
  }

  writeStream(path: string): NodeJS.WritableStream {
    return createWriteStream(path, {
      flags: "w",
      encoding: "binary",
    });
  }

  async deleteFile(path: string): Promise<void> {
    return new Promise((resolve) => {
      unlink(path, () => resolve());
    });
  }

  async ensureDirectory(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }
}
