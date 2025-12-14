/**
 * Port for file system operations
 * Abstracts file system details from the application layer
 */
export interface FileSystemManager {
  /**
   * Creates a directory and all parent directories if they don't exist
   * @param path The directory path to create
   */
  ensureDirectory(path: string): Promise<void>;

  /**
   * Checks if a directory exists
   * @param path The directory path to check
   */
  directoryExists(path: string): Promise<boolean>;

  /**
   * Checks if a file exists
   * @param path The file path to check
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Returns the default music folder path for the current OS user
   * Optionally appends a subfolder to the path
   * @param subfolder Optional subfolder to append
   */
  getDefaultMusicFolder(subfolder?: string): string;
}
