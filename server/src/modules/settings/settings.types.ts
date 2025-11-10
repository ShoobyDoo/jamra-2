export type SettingScope = "app" | "catalog" | "extensions" | "sandbox";

export interface Setting<T = unknown> {
  key: string;
  value: T;
  scope: SettingScope;
  updatedAt: Date;
}

export interface SettingsRepository {
  get<T>(key: string, scope?: SettingScope): Promise<Setting<T> | null>;
  set<T>(key: string, value: T, scope?: SettingScope): Promise<void>;
  list(scope?: SettingScope): Promise<Setting[]>;
  remove(key: string): Promise<void>;
}
