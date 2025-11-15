export type SettingScope = "app" | "catalog" | "extensions" | "sandbox";

export interface Setting<T = unknown> {
  key: string;
  scope: SettingScope;
  value: T;
  updatedAt: Date;
}
