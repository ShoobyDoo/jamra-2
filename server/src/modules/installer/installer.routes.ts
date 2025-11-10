import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { createExtensionPackager } from "./packager.js";
import { createInstallerService } from "./installer.service.js";
import { InstallerController } from "./installer.controller.js";
import { createPackageValidator } from "./validator.js";

export const createInstallerRouter = (context: AppContext): Router => {
  const router = Router();
  const validator = createPackageValidator();
  const packager = createExtensionPackager();
  const installer = createInstallerService({
    validator,
    packager,
    logger: context.logger,
  });
  const controller = new InstallerController(installer);

  router.post("/", controller.queue);

  return router;
};
