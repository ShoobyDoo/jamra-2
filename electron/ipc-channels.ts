export const IPC_CHANNELS = {
  preferences: {
    get: "preferences:get",
    set: "preferences:set",
    changed: "preferences:changed",
  },
  app: {
    showWindow: "app:show-window",
    openBrowser: "app:open-browser",
    exit: "app:exit",
  },
} as const;

export type PreferenceChannel = typeof IPC_CHANNELS.preferences;
