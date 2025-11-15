import chalk from "chalk";

function getTimestamp(): string {
  return chalk.gray(
    `[${new Date().toISOString().replace("T", " ").slice(0, 19)}]`
  );
}

function log(level: string, color: typeof chalk, ...message: unknown[]): void {
  console.log(`${getTimestamp()} ${color.bold(level)}:`, ...message);
}

/**
 * A simple logger utility for logging messages with different severity levels.
 * Supports info, warn, error, success, and debug levels.
 * Debug messages are only logged if the DEBUG environment variable is set to "true".
 */
export const logger = {
  info: (...message: unknown[]): void => {
    log("INFO", chalk.blue, ...message);
  },
  warn: (...message: unknown[]): void => {
    log("WARN", chalk.yellow, ...message);
  },
  error: (...message: unknown[]): void => {
    log("ERROR", chalk.red, ...message);
  },
  success: (...message: unknown[]): void => {
    log("SUCCESS", chalk.green, ...message);
  },
  debug: (...message: unknown[]): void => {
    if (process.env.DEBUG === "true") {
      log("DEBUG", chalk.magenta, ...message);
    }
  },
};
