import { app } from "electron";
import fs from "fs";
import path from "path";
import type {
  PreferenceKey,
  PreferenceValueMap,
} from "../src/types/electron-api";

const PREFERENCES_FILENAME = "preferences.json";

export const PREFERENCE_DEFAULTS: PreferenceValueMap = {
  closeButtonMinimizesToTray: true,
  // Reserved for future behavior (e.g., launch minimized)
  startMinimizedToTray: false,
};

export class PreferencesStore {
  private readonly filePath: string;
  private cache: PreferenceValueMap = { ...PREFERENCE_DEFAULTS };

  constructor() {
    this.filePath = path.join(app.getPath("userData"), PREFERENCES_FILENAME);
    this.load();
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.persist();
        return;
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<PreferenceValueMap>;
      this.cache = { ...PREFERENCE_DEFAULTS, ...parsed };
    } catch (error) {
      console.warn("Failed to load preferences, using defaults.", error);
      this.cache = { ...PREFERENCE_DEFAULTS };
      this.persist();
    }
  }

  private persist(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.warn("Failed to persist preferences:", error);
    }
  }

  get<K extends PreferenceKey>(key: K): PreferenceValueMap[K] {
    return this.cache[key];
  }

  set<K extends PreferenceKey>(
    key: K,
    value: PreferenceValueMap[K],
  ): PreferenceValueMap[K] {
    this.cache[key] = value;
    this.persist();
    return value;
  }

  all(): PreferenceValueMap {
    return { ...this.cache };
  }

  getDefault<K extends PreferenceKey>(key: K): PreferenceValueMap[K] {
    return PREFERENCE_DEFAULTS[key];
  }
}
