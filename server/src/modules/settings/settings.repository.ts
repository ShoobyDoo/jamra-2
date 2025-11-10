import { NotImplementedError } from "../../shared/errors.js";
import type {
  Setting,
  SettingScope,
  SettingsRepository,
} from "./settings.types.js";

export class SqliteSettingsRepository implements SettingsRepository {
  async get<T>(
    _key: string,
    _scope?: SettingScope,
  ): Promise<Setting<T> | null> {
    throw new NotImplementedError("Settings repository get");
  }

  async set<T>(
    _key: string,
    _value: T,
    _scope?: SettingScope,
  ): Promise<void> {
    throw new NotImplementedError("Settings repository set");
  }

  async list(_scope?: SettingScope): Promise<Setting[]> {
    throw new NotImplementedError("Settings repository list");
  }

  async remove(_key: string): Promise<void> {
    throw new NotImplementedError("Settings repository remove");
  }
}

export const createSettingsRepository = (): SettingsRepository => {
  return new SqliteSettingsRepository();
};
