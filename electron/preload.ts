import { contextBridge, ipcRenderer } from "electron";
import type {
  ElectronAPI,
  PreferenceKey,
  PreferenceValueMap,
} from "../src/types/electron-api";
import { IPC_CHANNELS } from "./ipc-channels";

const subscribeToPreference = <K extends PreferenceKey>(
  key: K,
  listener: (value: PreferenceValueMap[K]) => void,
): (() => void) => {
  const handler = (
    _event: Electron.IpcRendererEvent,
    payload:
      | {
          key: PreferenceKey;
          value: PreferenceValueMap[PreferenceKey];
        }
      | undefined,
  ): void => {
    if (!payload || payload.key !== key) {
      return;
    }
    listener(payload.value as PreferenceValueMap[K]);
  };

  ipcRenderer.on(IPC_CHANNELS.preferences.changed, handler);

  return (): void => {
    ipcRenderer.removeListener(IPC_CHANNELS.preferences.changed, handler);
  };
};

const electronAPI: ElectronAPI = {
  platform: process.platform,
  preferences: {
    get: <K extends PreferenceKey>(key: K) =>
      ipcRenderer.invoke(
        IPC_CHANNELS.preferences.get,
        key,
      ) as Promise<PreferenceValueMap[K]>,
    set: <K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]) =>
      ipcRenderer.invoke(
        IPC_CHANNELS.preferences.set,
        key,
        value,
      ) as Promise<PreferenceValueMap[K]>,
    subscribe: subscribeToPreference,
  },
  app: {
    showWindow: () => ipcRenderer.invoke(IPC_CHANNELS.app.showWindow),
    openInBrowser: () => ipcRenderer.invoke(IPC_CHANNELS.app.openBrowser),
    exit: () => ipcRenderer.invoke(IPC_CHANNELS.app.exit),
  },
};

contextBridge.exposeInMainWorld("electron", electronAPI);

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
