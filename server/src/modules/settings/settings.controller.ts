import type { Request, Response } from "express";
import { NotImplementedError } from "../../shared/errors.js";
import type { SettingsService } from "./settings.service.js";
import type { SettingScope } from "./settings.types.js";

export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = req.query.scope as SettingScope | undefined;
      const settings = await this.service.list(scope);
      res.json({ settings });
    } catch (error) {
      if (error instanceof NotImplementedError) {
        res
          .status(501)
          .json({ message: "Settings list not implemented yet." });
        return;
      }
      res.status(500).json({ message: "Failed to list settings." });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key, value, scope } = req.body as {
        key?: string;
        value?: unknown;
        scope?: SettingScope;
      };

      if (!key) {
        res.status(400).json({ message: "Key is required" });
        return;
      }

      await this.service.set(key, value, scope);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotImplementedError) {
        res
          .status(501)
          .json({ message: "Settings update not implemented yet." });
        return;
      }
      res.status(500).json({ message: "Failed to update settings." });
    }
  };
}
