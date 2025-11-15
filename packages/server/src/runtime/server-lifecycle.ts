import type { Socket } from "node:net";
import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { closeDatabase } from "../core/database/index.js";

let httpServer: HttpServer | null = null;
let websocketServer: WebSocketServer | null = null;
const openSockets: Set<Socket> = new Set();

export const bindServerLifecycle = (
  server: HttpServer,
  wss: WebSocketServer,
): void => {
  httpServer = server;
  websocketServer = wss;

  server.on("connection", (socket: Socket) => {
    openSockets.add(socket);
    socket.on("close", () => openSockets.delete(socket));
  });
};

export const shutdownServer = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log("Starting graceful shutdown...");

    const forceResolveTimeout = setTimeout(() => {
      console.warn("Graceful shutdown timeout. Forcing resolve...");
      resolve();
    }, 10000);

    if (!httpServer || !websocketServer) {
      clearTimeout(forceResolveTimeout);
      resolve();
      return;
    }

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

      websocketServer?.clients.forEach((client) => {
        client.close();
      });
      websocketServer?.close(() => {
        console.log("WebSocket server closed");
      });

      try {
        closeDatabase();
        console.log("Database closed");
      } catch (error) {
        console.error("Error closing database:", error);
      }

      clearTimeout(forceResolveTimeout);
      console.log("Graceful shutdown complete");
      resolve();
    });
  });
};
