import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { createExtensionLoader } from "./loader/extension-loader.js";
import { createExtensionRuntime } from "./runtime/extension-runtime.js";
import { createExtensionRegistry } from "./registry/registry.service.js";
import { ExtensionsController } from "./extensions.controller.js";
import { enableExtensionDevWatcher } from "./bootstrap/dev-watcher.js";
import { registerLocalExtensions } from "./bootstrap/local-registry.js";

export const createExtensionsRouter = (context: AppContext): Router => {
  const router = Router();
  const registry = createExtensionRegistry(context.db);
  const loader = createExtensionLoader({
    target: context.config.env === "development" ? "node20" : "node18",
  });
  const runtime = createExtensionRuntime(loader, {
    defaultTimeoutMs: context.config.extensions.runtime.timeoutMs,
    httpClient: context.httpClient,
    logger: context.logger,
    allowNetworkHosts: context.config.sandbox.allowNetworkHosts,
  });
  const controller = new ExtensionsController(registry, runtime);

  registerLocalExtensions(context, registry, loader).catch((error) => {
    context.logger.error("Failed to bootstrap local extensions", {
      error,
    });
  });

  enableExtensionDevWatcher({ context, registry, runtime, loader });

  router.get("/", controller.list);
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
  router.post("/install", controller.install);

  return router;
};
