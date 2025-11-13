import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { InstallerController } from "./installer.controller.js";
import { getInstallerModule } from "./installer.module.js";

export const createInstallerRouter = (context: AppContext): Router => {
  const router = Router();

  const { service } = getInstallerModule(context);
  const controller = new InstallerController(service);

  // Register routes
  router.post("/", controller.queue);
  router.get("/install/:jobId", controller.getInstallStatus);

  return router;
};
