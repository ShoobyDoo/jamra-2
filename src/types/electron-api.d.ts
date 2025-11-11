export type PreferenceKey =
  | "closeButtonMinimizesToTray"
  | "startMinimizedToTray";

export interface PreferenceValueMap {
  closeButtonMinimizesToTray: boolean;
  startMinimizedToTray: boolean;
}

export interface ElectronPreferencesAPI {
  get<K extends PreferenceKey>(key: K): Promise<PreferenceValueMap[K]>;
  set<K extends PreferenceKey>(
    key: K,
    value: PreferenceValueMap[K],
  ): Promise<PreferenceValueMap[K]>;
  subscribe<K extends PreferenceKey>(
    key: K,
    listener: (value: PreferenceValueMap[K]) => void,
  ): () => void;
}

export interface ElectronAppControlsAPI {
  showWindow(): Promise<void>;
  openInBrowser(): Promise<void>;
  exit(): Promise<void>;
}

export interface ElectronAPI {
  platform: NodeJS.Platform;
  preferences: ElectronPreferencesAPI;
  app: ElectronAppControlsAPI;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
