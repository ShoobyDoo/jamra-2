import { contextBridge } from "electron";

// Minimal preload script
// In REST API architecture, most communication happens via HTTP
// This can be extended later for Electron-specific features (file dialogs, etc.)

contextBridge.exposeInMainWorld("electron", {
  // TODO: Add Electron-specific APIs if needed
  platform: process.platform,
});

// Type declarations for renderer
declare global {
  interface Window {
    electron: {
      platform: string;
    };
  }
}
