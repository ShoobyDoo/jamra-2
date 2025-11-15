import type {
  SettingsRepository,
  Setting,
  SettingScope,
} from "./settings.types.js";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async get<T>(
    key: string,
    scope?: SettingScope,
  ): Promise<Setting<T> | null> {
    return this.repository.get<T>(key, scope);
  }

  async set<T>(key: string, value: T, scope?: SettingScope): Promise<void> {
    return this.repository.set(key, value, scope);
  }

  async list(scope?: SettingScope): Promise<Setting[]> {
    return this.repository.list(scope);
  }

  async remove(key: string): Promise<void> {
    return this.repository.remove(key);
  }
}
