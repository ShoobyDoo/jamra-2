/**
 * Settings Constants
 * Known setting keys and their configurations for the backend settings API
 */

import type { SettingScope } from "../types";

/**
 * Known setting keys organized by scope
 */
export const SETTING_KEYS = {
  // App scope settings
  APP: {
    THEME: "app.theme",
    LANGUAGE: "app.language",
  },
  // Reader scope settings
  READER: {
    PAGE_FIT: "reader.pageFit",
    READING_DIRECTION: "reader.readingDirection",
    PAGE_TURN_MODE: "reader.pageTurnMode",
    SHOW_PAGE_NUMBERS: "reader.showPageNumbers",
  },
  // Download scope settings
  DOWNLOADS: {
    QUALITY: "downloads.quality",
    CONCURRENT_LIMIT: "downloads.concurrentLimit",
    AUTO_DELETE_AFTER_READ: "downloads.autoDeleteAfterRead",
  },
  // Catalog scope settings
  CATALOG: {
    AUTO_SYNC: "catalog.autoSync",
    SYNC_INTERVAL: "catalog.syncInterval",
  },
  // Sandbox scope settings
  SANDBOX: {
    ALLOW_LIST: "sandbox.allowList",
  },
} as const;

/**
 * Setting scopes for organizing settings in the UI
 */
export const SETTING_SCOPES: { value: SettingScope; label: string }[] = [
  { value: "app", label: "Application" },
  { value: "catalog", label: "Catalog" },
  { value: "extensions", label: "Extensions" },
  { value: "sandbox", label: "Sandbox" },
];

/**
 * Reader page fit options
 */
export const PAGE_FIT_OPTIONS = [
  { value: "width", label: "Fit to Width" },
  { value: "height", label: "Fit to Height" },
  { value: "both", label: "Fit to Screen" },
  { value: "original", label: "Original Size" },
] as const;

/**
 * Reader direction options
 */
export const READING_DIRECTION_OPTIONS = [
  { value: "ltr", label: "Left to Right" },
  { value: "rtl", label: "Right to Left" },
  { value: "vertical", label: "Vertical" },
] as const;

/**
 * Reader page turn mode options
 */
export const PAGE_TURN_MODE_OPTIONS = [
  { value: "click", label: "Click/Tap" },
  { value: "swipe", label: "Swipe" },
  { value: "scroll", label: "Scroll" },
] as const;

/**
 * Download quality options
 */
export const DOWNLOAD_QUALITY_OPTIONS = [
  { value: "original", label: "Original (Highest Quality)" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low (Save Storage)" },
] as const;

/**
 * Theme options
 */
export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "System Default" },
] as const;

/**
 * Default setting values
 */
export const DEFAULT_SETTINGS = {
  [SETTING_KEYS.APP.THEME]: "auto",
  [SETTING_KEYS.APP.LANGUAGE]: "en",
  [SETTING_KEYS.READER.PAGE_FIT]: "width",
  [SETTING_KEYS.READER.READING_DIRECTION]: "ltr",
  [SETTING_KEYS.READER.PAGE_TURN_MODE]: "click",
  [SETTING_KEYS.READER.SHOW_PAGE_NUMBERS]: true,
  [SETTING_KEYS.DOWNLOADS.QUALITY]: "original",
  [SETTING_KEYS.DOWNLOADS.CONCURRENT_LIMIT]: 3,
  [SETTING_KEYS.DOWNLOADS.AUTO_DELETE_AFTER_READ]: false,
  [SETTING_KEYS.CATALOG.AUTO_SYNC]: false,
  [SETTING_KEYS.CATALOG.SYNC_INTERVAL]: 24,
  [SETTING_KEYS.SANDBOX.ALLOW_LIST]: [],
} as const;

/**
 * Helper to get default value for a setting key
 */
export const getDefaultSettingValue = (key: string): unknown => {
  return DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
};

/**
 * Helper to determine scope from setting key
 */
export const getScopeFromKey = (key: string): SettingScope => {
  if (key.startsWith("reader.")) return "app";
  if (key.startsWith("downloads.")) return "app";
  if (key.startsWith("catalog.")) return "catalog";
  if (key.startsWith("sandbox.")) return "sandbox";
  if (key.startsWith("app.")) return "app";
  return "app";
};
