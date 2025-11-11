import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  nativeImage,
  shell,
} from "electron";
import fs from "fs";
import { Server as HttpServer } from "http";
import path from "path";
import type {
  PreferenceKey,
  PreferenceValueMap,
} from "../src/types/electron-api";
import { initializeServer, shutdownServer } from "../server/dist/index.js";
import { PreferencesStore, PREFERENCE_DEFAULTS } from "./preferences-store";
import { IPC_CHANNELS } from "./ipc-channels";

// No Squirrel handlers — Electron Builder (NSIS/portable) is used on Windows

const isDev = !app.isPackaged;
const resolvePort = (value: string | undefined): number => {
  const parsed = Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) ? parsed : 3000;
};
const SERVER_PORT = resolvePort(process.env.PORT);
const SERVER_HOST = process.env.SERVER_HOST ?? "localhost";
const SERVER_BASE_URL =
  process.env.SERVER_BASE_URL ?? `http://${SERVER_HOST}:${SERVER_PORT}`;
const SERVER_HEALTH_URL = `${SERVER_BASE_URL}/health`;

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
let tray: Tray | null = null;
let httpServer: HttpServer | null = null;
let preferencesStore: PreferencesStore | null = null;
let isQuittingApp = false;
let isShuttingDownServer = false;

const resolveAssetPath = (assetName: string): string =>
  isDev
    ? path.join(process.cwd(), "public", assetName)
    : path.join(process.resourcesPath, assetName);

const shouldMinimizeToTray = (): boolean =>
  preferencesStore?.get("closeButtonMinimizesToTray") ??
  PREFERENCE_DEFAULTS.closeButtonMinimizesToTray;

const getPreferenceDefault = <K extends PreferenceKey>(
  key: K,
): PreferenceValueMap[K] => PREFERENCE_DEFAULTS[key];

const broadcastPreferenceChange = <K extends PreferenceKey>(
  key: K,
  value: PreferenceValueMap[K],
): void => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.preferences.changed, { key, value });
  }
};

const ensurePreferencesStore = (): PreferencesStore => {
  if (!preferencesStore) {
    throw new Error("Preferences store not initialized");
  }
  return preferencesStore;
};

const hideWindowToTray = (): void => {
  if (!mainWindow) return;
  mainWindow.setSkipTaskbar(true);
  mainWindow.hide();
  if (process.platform === "darwin") {
    app.dock?.hide();
  }
};

const showMainWindow = (): void => {
  if (!mainWindow) {
    createWindow();
  }
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
  if (process.platform === "darwin") {
    app.dock?.show();
  }
};

const requestAppQuit = (): void => {
  isQuittingApp = true;
  if (mainWindow) {
    mainWindow.close();
  } else {
    app.quit();
  }
};

const openServerInBrowser = async (): Promise<void> => {
  try {
    await shell.openExternal(SERVER_BASE_URL);
  } catch (error) {
    console.error("Failed to open browser:", error);
  }
};

const createTray = (): void => {
  if (tray) return;
  const trayIconName =
    process.platform === "win32" ? "jamra_icon.ico" : "jamra_icon_256.png";
  let trayImage = nativeImage.createFromPath(resolveAssetPath(trayIconName));
  if (trayImage.isEmpty()) {
    trayImage = nativeImage.createFromPath(resolveAssetPath("icon.png"));
  }
  if (process.platform === "darwin") {
    trayImage.setTemplateImage(true);
  }
  tray = new Tray(trayImage);
  tray.setToolTip("JAMRA Manga Reader");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Window",
      click: () => {
        showMainWindow();
      },
    },
    {
      label: "Open in Browser",
      click: () => {
        void openServerInBrowser();
      },
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => requestAppQuit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    showMainWindow();
  });
};

const registerIpcHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.preferences.get, (_event, key: PreferenceKey) => {
    try {
      return ensurePreferencesStore().get(key);
    } catch (error) {
      console.error("Failed to get preference", error);
      return getPreferenceDefault(key);
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.preferences.set,
    (_event, key: PreferenceKey, value: PreferenceValueMap[PreferenceKey]) => {
      try {
        const next = ensurePreferencesStore().set(
          key,
          value as PreferenceValueMap[PreferenceKey],
        );
        broadcastPreferenceChange(key, next);
        return next;
      } catch (error) {
        console.error("Failed to set preference", error);
        return getPreferenceDefault(key);
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.app.showWindow, () => {
    showMainWindow();
  });

  ipcMain.handle(IPC_CHANNELS.app.openBrowser, () => {
    void openServerInBrowser();
  });

  ipcMain.handle(IPC_CHANNELS.app.exit, () => {
    requestAppQuit();
  });
};

/**
 * Start the Express server in the Electron main process.
 * In development: tsx watch runs the server separately, Electron just connects to it.
 * In production: Server runs directly in the Electron main process.
 */
const startServer = async (): Promise<void> => {
  // Set environment variables for server
  process.env.DB_PATH = app.getPath("userData");
  process.env.RESOURCES_PATH = process.resourcesPath;
  process.env.ELECTRON_PACKAGED = app.isPackaged ? "true" : "false";

  if (isDev) {
    console.log(
      `Development mode: Server runs via tsx watch on ${SERVER_BASE_URL}`,
    );
    console.log("Skipping server initialization in Electron");
    console.log(`Waiting for backend server at ${SERVER_BASE_URL}...`);
    return;
  }

  console.log("Production mode: Initializing Express server in main process...");

  try {
    // Initialize server directly (only in production)
    const { server } = initializeServer();
    httpServer = server;

    await new Promise<void>((resolve, reject) => {
      server.listen(SERVER_PORT, () => {
        console.log(`✅ Server running at ${SERVER_BASE_URL}`);
        console.log(`✅ API available at ${SERVER_BASE_URL}/api`);
        console.log(`🔌 WebSocket server available at ws://${SERVER_HOST}:${SERVER_PORT}`);
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
      const response = await fetch(SERVER_HEALTH_URL);
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
  if (mainWindow) {
    return;
  }

  // Preload script must be outside ASAR (security requirement)
  const preloadPath = isDev
    ? path.join(__dirname, "dist-electron", "preload.js")
    : path.join(
        process.resourcesPath,
        "app.asar.unpacked",
        "dist-electron",
        "preload.js",
      );

  const iconFile =
    process.platform === "win32" ? "jamra_icon.ico" : "jamra_icon_256.png";
  const iconPath = resolveAssetPath(iconFile);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: nativeImage.createFromPath(iconPath),
    show: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("close", (event) => {
    if (!isQuittingApp && shouldMinimizeToTray()) {
      event.preventDefault();
      hideWindowToTray();
      return;
    }
    mainWindow = null;
  });

  mainWindow.on("show", () => {
    mainWindow?.setSkipTaskbar(false);
    if (process.platform === "darwin") {
      app.dock?.show();
    }
  });

  mainWindow.on("hide", () => {
    if (process.platform === "darwin") {
      app.dock?.hide();
    }
  });

  // Load dev server URL (Vite runs on port 5173)
  // In production, load index.html by file path for cross‑platform correctness
  if (isDev) {
    void mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    void mainWindow.loadFile(indexPath);
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
    preferencesStore = new PreferencesStore();
    registerIpcHandlers();

    // Start Express server in main process
    await startServer();

    // Verify server is healthy
    const isHealthy = await checkServerHealth();

    if (!isHealthy) {
      console.error("Server failed health check. Exiting.");
      app.quit();
      return;
    }

    // Server is healthy, initialize UI + tray
    createWindow();
    createTray();

    app.on("activate", () => {
      showMainWindow();
    });
  } catch (error: unknown) {
    console.error(
      "Failed to start application:",
      error instanceof Error ? error.stack || error.message : String(error),
    );
    app.quit();
  }
});

// Always keep the app running in background until explicitly quit
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Ensure cleanup on app quit
app.on("before-quit", async (event) => {
  isQuittingApp = true;
  tray?.destroy();
  tray = null;

  if (!httpServer || isShuttingDownServer) {
    return;
  }

  event.preventDefault();
  isShuttingDownServer = true;

  // Force-exit fallback in case of stubborn sockets
  const forceExit = setTimeout(() => {
    try {
      app.exit(0);
    } catch (err) {
      console.warn("app.exit failed, forcing process.exit(0)", err);
      process.exit(0);
    }
  }, 8000);

  try {
    await shutdownServer();
  } catch (error) {
    console.error("Error shutting down server:", error);
  } finally {
    clearTimeout(forceExit);
    httpServer = null;
    isShuttingDownServer = false;
    app.quit();
  }
});
