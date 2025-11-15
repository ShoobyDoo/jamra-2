import type { Request, Response } from "express";
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
      console.error("Failed to list settings:", error);
      res.status(500).json({ message: "Failed to list settings." });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const scope = req.query.scope as SettingScope | undefined;

      if (!key) {
        res.status(400).json({ message: "Key is required" });
        return;
      }

      const setting = await this.service.get(key, scope);

      if (!setting) {
        res.status(404).json({ message: "Setting not found" });
        return;
      }

      res.json({ setting });
    } catch (error) {
      console.error("Failed to get setting:", error);
      res.status(500).json({ message: "Failed to get setting." });
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
      console.error("Failed to update setting:", error);
      res.status(500).json({ message: "Failed to update setting." });
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(400).json({ message: "Key is required" });
        return;
      }

      await this.service.remove(key);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to remove setting:", error);
      res.status(500).json({ message: "Failed to remove setting." });
    }
  };
}
