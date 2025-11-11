import type { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] → ${req.method} ${req.path}`);

  // Hook into response finish event to log duration and status
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusColor =
      res.statusCode >= 500
        ? "\x1b[31m" // Red for 5xx
        : res.statusCode >= 400
          ? "\x1b[33m" // Yellow for 4xx
          : res.statusCode >= 300
            ? "\x1b[36m" // Cyan for 3xx
            : "\x1b[32m"; // Green for 2xx

    console.log(
      `[${new Date().toISOString()}] ← ${req.method} ${req.path} ${statusColor}${res.statusCode}\x1b[0m ${duration}ms`,
    );
  });

  next();
};
