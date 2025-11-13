import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { getExtensionsModule } from "../extensions/extensions.module.js";
import { createLibraryRepository } from "../library/library.repository.js";
import { createProgressRepository } from "../library/progress.repository.js";
import { createDownloadsRepository } from "../downloads/downloads.repository.js";
import { ReaderService } from "./reader.service.js";
import { ImageProxyService } from "./image-proxy.service.js";
import { ReaderController } from "./reader.controller.js";

export const createReaderRouter = (context: AppContext): Router => {
  const router = Router();

  const libraryRepository = createLibraryRepository(context.db);
  const progressRepository = createProgressRepository(context.db);
  const downloadsRepository = createDownloadsRepository(context.db);
  const { registry, runtime } = getExtensionsModule(context);

  const readerService = new ReaderService({
    libraryRepository,
    progressRepository,
    downloadsRepository,
    registry,
    runtime,
    logger: context.logger,
  });

  const imageProxy = new ImageProxyService(context.logger);
  const controller = new ReaderController(readerService, imageProxy);

  router.get("/:libraryId/chapters/:chapterId", controller.getChapter);
  router.get(
    "/:libraryId/chapters/:chapterId/next",
    controller.getNextChapter,
  );
  router.get(
    "/:libraryId/chapters/:chapterId/previous",
    controller.getPreviousChapter,
  );
  router.get(
    "/:libraryId/chapters/:chapterId/pages/:pageNumber",
    controller.getPageImage,
  );

  return router;
};
