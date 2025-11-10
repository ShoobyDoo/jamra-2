import { NotImplementedError } from "../../shared/errors.js";
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
    throw new NotImplementedError(`Settings get ${scope ?? "global"}:${key}`);
  }

  async set<T>(key: string, value: T, scope?: SettingScope): Promise<void> {
    throw new NotImplementedError(`Settings set ${scope ?? "global"}:${key}`);
  }

  async list(scope?: SettingScope): Promise<Setting[]> {
    throw new NotImplementedError(`Settings list ${scope ?? "global"}`);
  }
}
