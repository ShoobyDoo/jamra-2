type LogLevel = "info" | "warn" | "error" | "debug";

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  debug: "DEBUG",
};

const MAX_LEVEL_LENGTH = Math.max(
  ...Object.values(LEVEL_LABELS).map((label) => label.length),
);

const formatLevel = (level: LogLevel): string =>
  LEVEL_LABELS[level].padEnd(MAX_LEVEL_LENGTH, " ");

const log =
  (level: "info" | "warn" | "error" | "debug") =>
  (message: string, meta: Record<string, unknown> = {}): void => {
    const parts = [message];

    if (Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }

    console[level](`[${formatLevel(level)}] ${parts.join(" ")}`);
  };

export const createLogger = (): Logger => ({
  info: log("info"),
  warn: log("warn"),
  error: log("error"),
  debug: log("debug"),
});
