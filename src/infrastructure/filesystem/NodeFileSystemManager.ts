import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { FileSystemManager } from "../../application/ports/FileSystemManager.js";

export class NodeFileSystemManager implements FileSystemManager {
  async ensureDirectory(path: string): Promise<void> {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory ${path}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async directoryExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the default music folder for downloads
   * Windows: C:\Users\<user>\Music\YouTube Music Downloads
   * macOS/Linux: /Users/<user>/Music/YouTube Music Downloads
   */
  getDefaultMusicFolder(subfolder: string = "YouTube Music Downloads"): string {
    return join(homedir(), "Music", subfolder);
  }
}
