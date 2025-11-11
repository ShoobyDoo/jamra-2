import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { createExtensionPackager } from "./packager.js";
import { createInstallerService } from "./installer.service.js";
import { InstallerController } from "./installer.controller.js";
import { createGitRepositoryFetcher } from "./fetchers/git-fetcher.js";
import { createExtensionSourceFetcher } from "./fetchers/source-fetcher.js";
import { createExtensionCompiler } from "./compiler/extension-compiler.js";
import { createExtensionLoader } from "../extensions/loader/extension-loader.js";

export const createInstallerRouter = (context: AppContext): Router => {
  const router = Router();

  // Get extensions directory from config
  const extensionsDir = context.config.extensions.installDir;

  // Create all dependencies
  const packager = createExtensionPackager(context.db, extensionsDir);
  const gitFetcher = createGitRepositoryFetcher(context.httpClient);
  const sourceFetcher = createExtensionSourceFetcher(context.httpClient);
  const compiler = createExtensionCompiler();
  const loader = createExtensionLoader();

  // Create installer service with all dependencies
  const installer = createInstallerService({
    db: context.db,
    packager,
    gitFetcher,
    sourceFetcher,
    compiler,
    loader,
    logger: context.logger,
  });

  // Create controller
  const controller = new InstallerController(installer);

  // Register routes
  router.post("/", controller.queue);
  router.get("/install/:jobId", controller.getInstallStatus);

  return router;
};
