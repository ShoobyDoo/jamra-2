import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { getInstallerModule } from "../installer/installer.module.js";
import { ExtensionsController } from "./extensions.controller.js";
import { getExtensionsModule } from "./extensions.module.js";

export const createExtensionsRouter = (context: AppContext): Router => {
  const router = Router();
  const { registry, runtime } = getExtensionsModule(context);
  const { service: installer } = getInstallerModule(context);
  const controller = new ExtensionsController(registry, runtime, installer);

  router.get("/", controller.list);
  router.post("/install", controller.install);
  router.get("/install/:jobId", controller.getInstallStatus);
  router.get("/:extensionId/search", controller.search);
  router.get(
    "/:extensionId/manga/:mangaId/chapters/:chapterId/pages",
    controller.pages,
  );
  router.get(
    "/:extensionId/manga/:mangaId/chapters",
    controller.chapters,
  );
  router.get("/:extensionId/manga/:mangaId", controller.mangaDetails);
  router.get("/:extensionId", controller.detail);

  return router;
};
