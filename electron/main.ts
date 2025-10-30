import { ChildProcess, spawn } from "child_process";
import { app, BrowserWindow, dialog } from "electron";
import path from "path";

// Use Electron's app.getAppPath() as an equivalent for __dirname so we avoid using import.meta
const __dirname = app.getAppPath();

let serverProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const startServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const isDev = !app.isPackaged;

      // In development, server is already running via 'pnpm dev:all'
      // Only spawn server in production
      if (isDev) {
        console.log("Checking for backend...");
        resolve();
        return;
      }

      // Production mode: spawn the server
      const serverPath = path.join(
        process.resourcesPath,
        "app.asar.unpacked",
        "server",
        "dist",
        "index.js",
      );

      // Get userData directory for database storage
      const dbPath = app.getPath("userData");

      console.log("Starting server from:", serverPath);
      console.log("Database path:", dbPath);

      // Spawn server using Electron's bundled Node.js (not system Node.js)
      // ELECTRON_RUN_AS_NODE tells Electron to run as Node.js instead of Electron
      // Set cwd to app.asar.unpacked so node_modules can be resolved
      const unpackedPath = path.join(
        process.resourcesPath,
        "app.asar.unpacked"
      );

      serverProcess = spawn(process.execPath, [serverPath], {
        cwd: unpackedPath,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
          DB_PATH: dbPath,
          ELECTRON_PACKAGED: "true",
          RESOURCES_PATH: process.resourcesPath,
        },
      });

      console.log("Started Express server (pid:", serverProcess.pid, ")");

      // Capture stderr for error reporting
      let stderrOutput = "";

      // Handle server errors
      serverProcess.on("error", (error) => {
        console.error("Server process error:", error);
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Log server output
      serverProcess.stdout?.on("data", (data) => {
        console.log("Server:", data.toString());
      });

      serverProcess.stderr?.on("data", (data) => {
        const errorText = data.toString();
        console.error("Server error:", errorText);
        stderrOutput += errorText;
      });

      // Handle server exit
      serverProcess.on("exit", (code, signal) => {
        console.log(`Server exited with code ${code} and signal ${signal}`);
        if (code !== 0 && code !== null) {
          const errorMessage = stderrOutput
            ? `Server exited with code ${code}\n\nError output:\n${stderrOutput}`
            : `Server exited with code ${code}`;
          reject(new Error(errorMessage));
        }
      });

      // Resolve after a brief delay to allow server to start
      setTimeout(() => resolve(), 1000);
    } catch (error) {
      reject(error);
    }
  });
};

const stopServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }

    console.log("Stopping server gracefully...");

    // Try graceful shutdown first with SIGTERM
    serverProcess.kill("SIGTERM");

    // Wait for graceful shutdown (max 5 seconds)
    const gracefulTimeout = setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        console.warn("Server did not stop gracefully, forcing shutdown...");
        serverProcess.kill("SIGKILL");
      }
    }, 5000);

    // Handle process exit
    serverProcess.on("exit", (code, signal) => {
      clearTimeout(gracefulTimeout);
      console.log(`Server stopped (code: ${code}, signal: ${signal})`);
      serverProcess = null;
      resolve();
    });
  });
};

const checkServerHealth = async (): Promise<boolean> => {
  const maxRetries = 5;
  const retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("http://localhost:3000/health");
      if (response.ok) {
        console.log("✓ Connected! Server health check passed");
        return true;
      }
    } catch (error) {
      console.log(`Health check attempt ${i + 1}/${maxRetries} failed:`, error);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return false;
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load dev server URL (Vite runs on port 5173)
  const isDev = !app.isPackaged;
  const url = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;
  mainWindow.loadURL(url);
};

app.whenReady().then(async () => {
  try {
    // Start server
    await startServer();

    // Verify server is healthy
    const isHealthy = await checkServerHealth();

    if (!isHealthy) {
      const isDev = !app.isPackaged;
      const errorMessage = isDev
        ? "The backend server is not responding. Make sure you started the app with 'pnpm dev:all' which runs both frontend and backend.\n\nThe application will now exit."
        : "The backend server could not start. Please check the logs and try again.\n\nThe application will now exit.";

      dialog.showErrorBox("Server Failed to Start", errorMessage);
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
  } catch (error) {
    console.error("Failed to start application:", error);
    dialog.showErrorBox(
      "Application Startup Failed",
      `An error occurred while starting the application:\n\n${error instanceof Error ? error.message : String(error)}\n\nThe application will now exit.`,
    );
    app.quit();
  }
});

app.on("window-all-closed", async () => {
  await stopServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Ensure cleanup on app quit
app.on("before-quit", async (event) => {
  if (serverProcess) {
    event.preventDefault(); // Prevent immediate quit
    await stopServer();
    app.quit(); // Now quit after cleanup
  }
});
