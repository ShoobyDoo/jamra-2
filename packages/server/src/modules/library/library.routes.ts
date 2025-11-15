import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { createLibraryRepository } from "./library.repository.js";
import { createProgressRepository } from "./progress.repository.js";
import { LibraryService } from "./library.service.js";
import { LibraryController } from "./library.controller.js";

export const createLibraryRouter = (context: AppContext): Router => {
  const router = Router();

  // Initialize repositories
  const libraryRepository = createLibraryRepository(context.db);
  const progressRepository = createProgressRepository(context.db);

  // Initialize service
  const service = new LibraryService(libraryRepository, progressRepository);

  // Initialize controller
  const controller = new LibraryController(service);

  // Library management routes
  router.get("/stats", controller.getStats);
  router.get("/", controller.list);
  router.post("/", controller.add);
  router.get("/:id", controller.get);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);
  router.patch("/:id/favorite", controller.toggleFavorite);

  // Reading progress routes
  router.get("/:id/progress", controller.getAllProgress);
  router.put("/:id/progress", controller.updateProgress);
  router.get(
    "/:id/chapters/:chapterId/progress",
    controller.getChapterProgress,
  );
  router.get("/:id/last-read", controller.getLastRead);

  return router;
};
