import { app, BrowserWindow } from "electron";
import fs from "fs";
import { Server as HttpServer } from "http";
import path from "path";
import { initializeServer, shutdownServer } from "../server/dist/index.js";

// No Squirrel handlers — Electron Builder (NSIS/portable) is used on Windows

// Minimal file logger
let logFilePath: string | null = null;
const earlyBuffer: string[] = [];
const writeLog = (level: string, ...parts: unknown[]): void => {
  if (!logFilePath) return;
  const ts = new Date().toISOString();
  const msg = parts
    .map((p) =>
      typeof p === "string"
        ? p
        : (() => {
            try {
              return JSON.stringify(p);
            } catch {
              return String(p);
            }
          })(),
    )
    .join(" ");
  try {
    fs.appendFileSync(logFilePath, `[${ts}] [${level}] ${msg}\n`);
  } catch {
    // Swallow logging errors (e.g., disk full). Intentionally no-op.
    void 0;
  }
};
// Catch errors as early as possible, before app is ready
process.on("uncaughtException", (error: unknown) => {
  const e =
    error instanceof Error ? error.stack || error.message : String(error);
  earlyBuffer.push(
    `[${new Date().toISOString()}] [FATAL] uncaughtException ${e}`,
  );
});
process.on("unhandledRejection", (reason: unknown) => {
  const r =
    typeof reason === "string"
      ? reason
      : (() => {
          try {
            return JSON.stringify(reason);
          } catch {
            return String(reason);
          }
        })();
  earlyBuffer.push(
    `[${new Date().toISOString()}] [FATAL] unhandledRejection ${r}`,
  );
});
const setupLogging = (): void => {
  try {
    const logsDir = path.join(app.getPath("userData"), "logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    logFilePath = path.join(logsDir, "main.log");
    const orig = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
    console.log = (...a: unknown[]) => {
      writeLog("INFO", ...a);
      (orig.log as (...args: unknown[]) => void)(...a);
    };
    console.info = (...a: unknown[]) => {
      writeLog("INFO", ...a);
      (orig.info as (...args: unknown[]) => void)(...a);
    };
    console.warn = (...a: unknown[]) => {
      writeLog("WARN", ...a);
      (orig.warn as (...args: unknown[]) => void)(...a);
    };
    console.error = (...a: unknown[]) => {
      writeLog("ERROR", ...a);
      (orig.error as (...args: unknown[]) => void)(...a);
    };
    // Flush any early buffered errors
    if (earlyBuffer.length) {
      try {
        fs.appendFileSync(logFilePath, earlyBuffer.join("\n") + "\n");
      } catch (err) {
        console.warn("Failed to flush early log buffer:", err);
      }
      earlyBuffer.length = 0;
    }
  } catch (err) {
    // If logger setup fails, continue without file logging but record once to console.
    console.warn("Logger setup failed:", err);
  }
};

// Use Electron's app.getAppPath() as an equivalent for __dirname
const __dirname = app.getAppPath();

let mainWindow: BrowserWindow | null = null;
let httpServer: HttpServer | null = null;

/**
 * Start the Express server in the Electron main process.
 * No child process spawning - runs directly in the same process.
 */
const startServer = async (): Promise<void> => {
  const isDev = !app.isPackaged;

  console.log("Initializing Express server in main process...");

  // Set database path to user data directory
  process.env.DB_PATH = app.getPath("userData");
  process.env.RESOURCES_PATH = process.resourcesPath;
  process.env.ELECTRON_PACKAGED = app.isPackaged ? "true" : "false";

  if (isDev) {
    console.log("Development mode: Server code hot-reloads via tsx watch");
    console.log("Waiting for backend to be ready...");
  }

  try {
    // Initialize server directly (no spawning)
    const { server } = initializeServer();
    httpServer = server;

    // Start listening on port 3000
    await new Promise<void>((resolve, reject) => {
      server.listen(3000, () => {
        console.log("✅ Server running at http://localhost:3000");
        console.log("✅ API available at http://localhost:3000/api");
        console.log("🔌 WebSocket server available at ws://localhost:3000");
        resolve();
      });

      server.on("error", (error: unknown) => {
        console.error("Failed to start server:", error);
        reject(error);
      });
    });
  } catch (error: unknown) {
    console.error("Error initializing server:", error);
    throw error;
  }
};

/**
 * Verify server health by making HTTP request to health endpoint.
 */
const checkServerHealth = async (): Promise<boolean> => {
  const maxRetries = 5;
  const retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("http://localhost:3000/health");
      if (response.ok) {
        console.log("✅ Server health check passed");
        return true;
      }
    } catch (error: unknown) {
      console.log(`Health check attempt ${i + 1}/${maxRetries} failed:`, error);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return false;
};

/**
 * Create the Electron browser window.
 */
const createWindow = (): void => {
  const isDev = !app.isPackaged;

  // Preload script must be outside ASAR (security requirement)
  const preloadPath = isDev
    ? path.join(__dirname, "dist-electron", "preload.js")
    : path.join(
        process.resourcesPath,
        "app.asar.unpacked",
        "dist-electron",
        "preload.js",
      );

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Load dev server URL (Vite runs on port 5173)
  // In production, load index.html by file path for cross‑platform correctness
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    mainWindow.loadFile(indexPath);
  }
};

// Application initialization
app.whenReady().then(async () => {
  try {
    // Improve process naming/identity on Windows
    try {
      app.setAppUserModelId("com.jamra.reader");
      app.setName("Jamra Manga Reader");
      process.title = "Jamra Manga Reader (Main)";
    } catch (err) {
      console.warn("Failed to set app identity:", err);
    }

    setupLogging();

    // Start Express server in main process
    await startServer();

    // Verify server is healthy
    const isHealthy = await checkServerHealth();

    if (!isHealthy) {
      console.error("Server failed health check. Exiting.");
      app.quit();
      return;
    }

    // Server is healthy, create window
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error: unknown) {
    console.error(
      "Failed to start application:",
      error instanceof Error ? error.stack || error.message : String(error),
    );
    app.quit();
  }
});

// Gracefully shutdown server when app quits
app.on("window-all-closed", async () => {
  await shutdownServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Ensure cleanup on app quit
app.on("before-quit", async (event) => {
  if (httpServer) {
    event.preventDefault(); // Prevent immediate quit
    // Force-exit fallback in case of stubborn sockets
    const forceExit = setTimeout(() => {
      try {
        app.exit(0);
      } catch (err) {
        console.warn("app.exit failed, forcing process.exit(0)", err);
        process.exit(0);
      }
    }, 8000);
    await shutdownServer();
    httpServer = null;
    clearTimeout(forceExit);
    app.quit(); // Now quit after cleanup
  }
});
