import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { createLibraryRepository } from "../library/library.repository.js";
import { getExtensionsModule } from "../extensions/extensions.module.js";
import { createDownloadsRepository } from "./downloads.repository.js";
import { createDownloadFileManager } from "./storage/file-manager.js";
import { DownloadsService } from "./downloads.service.js";
import { DownloadsController } from "./downloads.controller.js";

export const createDownloadsRouter = (context: AppContext): Router => {
  const router = Router();

  const downloadsRepository = createDownloadsRepository(context.db);
  const libraryRepository = createLibraryRepository(context.db);
  const fileManager = createDownloadFileManager();
  const { registry, runtime } = getExtensionsModule(context);

  const service = new DownloadsService({
    repository: downloadsRepository,
    libraryRepository,
    fileManager,
    registry,
    runtime,
    logger: context.logger,
  });

  void service.initialize();

  const controller = new DownloadsController(service);

  router.get("/stats", controller.stats);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.detail);
  router.delete("/:id", controller.cancel);

  return router;
};

