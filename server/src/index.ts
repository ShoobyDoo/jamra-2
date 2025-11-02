import cors from "cors";
import express from "express";
import { createServer, Server as HttpServer } from "http";
import type { Socket } from "node:net";
import { WebSocketServer } from "ws";
import { closeDatabase, getDatabase } from "./database/connection.js";
import { runMigrations } from "./database/migrations.js";
import chapterRoutes from "./routes/chapter.routes.js";
import downloadRoutes from "./routes/download.routes.js";
import libraryRoutes from "./routes/library.routes.js";
import mangaRoutes from "./routes/manga.routes.js";
import { initializeWebSocketServer } from "./websocket/handlers.js";

// Store server instances for cleanup
let httpServer: HttpServer | null = null;
let websocketServer: WebSocketServer | null = null;
const openSockets: Set<Socket> = new Set();

/**
 * Initialize and configure the Express server with all routes, middleware,
 * database, and WebSocket support.
 *
 * This function can be called from Electron's main process or run standalone.
 *
 * @returns Object containing the Express app and HTTP server instances
 */
export const initializeServer = (): {
  app: express.Application;
  server: HttpServer;
  wss: WebSocketServer;
} => {
  const app = express();

  // Create HTTP server (needed for WebSocket upgrade)
  const server = createServer(app);
  httpServer = server;
  // Track open TCP connections so we can destroy them on shutdown
  server.on("connection", (socket: Socket) => {
    openSockets.add(socket);
    socket.on("close", () => openSockets.delete(socket));
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize database
  const db = getDatabase();
  runMigrations(db);

  // Register routes
  app.use("/api/manga", mangaRoutes);
  app.use("/api/chapters", chapterRoutes);
  app.use("/api/library", libraryRoutes);
  app.use("/api/downloads", downloadRoutes);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server });
  websocketServer = wss;
  initializeWebSocketServer(wss);

  console.log("✅ Server initialized successfully");

  return { app, server, wss };
};

/**
 * Gracefully shutdown the server, closing all connections and cleaning up resources.
 *
 * @returns Promise that resolves when shutdown is complete
 */
export const shutdownServer = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log("Starting graceful shutdown...");

    // Set a timeout to force resolve if shutdown takes too long
    const forceResolveTimeout = setTimeout(() => {
      console.warn("Graceful shutdown timeout. Forcing resolve...");
      resolve();
    }, 10000); // 10 second timeout

    if (!httpServer || !websocketServer) {
      clearTimeout(forceResolveTimeout);
      resolve();
      return;
    }

    // 1. Stop accepting new connections and proactively destroy keep-alive sockets
    for (const socket of openSockets) {
      try {
        socket.destroy();
      } catch (err) {
        console.warn("Error destroying socket", err);
      }
      openSockets.delete(socket);
    }

    httpServer.close((err) => {
      if (err) {
        console.error("Error closing HTTP server:", err);
      } else {
        console.log("HTTP server closed");
      }

      // 2. Close WebSocket connections
      websocketServer?.clients.forEach((client) => {
        client.close();
      });
      websocketServer?.close(() => {
        console.log("WebSocket server closed");
      });

      // 3. Close database connection
      try {
        closeDatabase();
        console.log("Database closed");
      } catch (error) {
        console.error("Error closing database:", error);
      }

      // Clear the force resolve timeout
      clearTimeout(forceResolveTimeout);

      console.log("Graceful shutdown complete");
      resolve();
    });
  });
};

// Only start server if running standalone (not imported by Electron)
// Safely detect if this module was invoked directly (argv[1] may be undefined in packaged apps)
let isMainModule = false;
try {
  const arg1 = process.argv?.[1];
  if (typeof arg1 === "string" && arg1.length > 0) {
    const normalized = `file://${arg1.replace(/\\/g, "/")}`;
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
