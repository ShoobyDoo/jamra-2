import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { SettingsController } from "./settings.controller.js";
import { createSettingsRepository } from "./settings.repository.js";
import { SettingsService } from "./settings.service.js";

export const createSettingsRouter = (_context: AppContext): Router => {
  const router = Router();
  const repository = createSettingsRepository();
  const service = new SettingsService(repository);
  const controller = new SettingsController(service);

  router.get("/", controller.list);
  router.put("/", controller.update);

  return router;
};
