import { createServer, Server as HttpServer } from "http";
import { pathToFileURL } from "node:url";
import type { Application } from "express";
import { WebSocketServer } from "ws";
import { createApp } from "./app/app.js";
import type { AppContext } from "./app/context.js";
import { loadAppConfig } from "./core/config/app-config.js";
import { getDatabase, runMigrations } from "./core/database/index.js";
import { createHttpClient } from "./shared/http/http-client.js";
import { createLogger } from "./shared/logger.js";
import { initializeWebSocketServer } from "./websocket/handlers.js";
import {
  bindServerLifecycle,
  shutdownServer,
} from "./runtime/server-lifecycle.js";

export { shutdownServer } from "./runtime/server-lifecycle.js";

/**
 * Initialize and configure the Express server with all routes, middleware,
 * database, and WebSocket support.
 *
 * This function can be called from Electron's main process or run standalone.
 *
 * @returns Object containing the Express app and HTTP server instances
 */
export const initializeServer = (): {
  app: Application;
  server: HttpServer;
  wss: WebSocketServer;
} => {
  const config = loadAppConfig();
  const logger = createLogger();
  const httpClient = createHttpClient();
  const db = getDatabase();
  runMigrations(db);

  const context: AppContext = {
    config,
    db,
    httpClient,
    logger,
  };

  const app = createApp(context);

  const server = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server });
  bindServerLifecycle(server, wss);
  initializeWebSocketServer(wss);

  console.log("✅ Server initialized successfully");

  return { app, server, wss };
};

// Only start server if running standalone (not imported by Electron)
// Safely detect if this module was invoked directly (argv[1] may be undefined in packaged apps)
let isMainModule = false;
try {
  const arg1 = process.argv?.[1];
  if (typeof arg1 === "string" && arg1.length > 0) {
    // Use pathToFileURL for proper cross-platform file:// URL conversion
    const normalized = pathToFileURL(arg1).href;
    isMainModule = import.meta.url === normalized;
  }
} catch {
  isMainModule = false;
}

if (isMainModule) {
  const PORT = process.env.PORT || 3000;
  const { server } = initializeServer();

  // Start HTTP server (handles both Express and WebSocket)
  server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`✅ API available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket server available at ws://localhost:${PORT}`);
  });

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received`);
    await shutdownServer();
    process.exit(0);
  };

  // Register signal handlers for graceful shutdown
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
  });
}
