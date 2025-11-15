import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { SettingsController } from "./settings.controller.js";
import { createSettingsRepository } from "./settings.repository.js";
import { SettingsService } from "./settings.service.js";

export const createSettingsRouter = (context: AppContext): Router => {
  const router = Router();
  const repository = createSettingsRepository(context.db);
  const service = new SettingsService(repository);
  const controller = new SettingsController(service);

  router.get("/", controller.list);
  router.get("/:key", controller.get);
  router.put("/", controller.update);
  router.delete("/:key", controller.remove);

  return router;
};
