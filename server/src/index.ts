import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mangaRoutes from './routes/manga.routes.js';
import chapterRoutes from './routes/chapter.routes.js';
import libraryRoutes from './routes/library.routes.js';
import downloadRoutes from './routes/download.routes.js';
import { getDatabase, closeDatabase } from './database/connection.js';
import { runMigrations } from './database/migrations.js';
import { initializeWebSocketServer } from './websocket/handlers.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server (needed for WebSocket upgrade)
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = getDatabase();
runMigrations(db);

// Register routes
app.use('/api/manga', mangaRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/downloads', downloadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
initializeWebSocketServer(wss);

// Start HTTP server (handles both Express and WebSocket)
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string): void => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    console.error('Graceful shutdown timeout. Forcing exit...');
    process.exit(1);
  }, 10000); // 10 second timeout

  // 1. Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
    } else {
      console.log('HTTP server closed');
    }

    // 2. Close WebSocket connections
    wss.clients.forEach((client) => {
      client.close();
    });
    wss.close(() => {
      console.log('WebSocket server closed');
    });

    // 3. Close database connection
    try {
      closeDatabase();
    } catch (error) {
      console.error('Error closing database:', error);
    }

    // Clear the force exit timeout
    clearTimeout(forceExitTimeout);

    console.log('Graceful shutdown complete');
    process.exit(0);
  });
};

// Register signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;
