import type { Application } from "express";
import { createCatalogRouter } from "../modules/catalog/catalog.routes.js";
import { createExtensionsRouter } from "../modules/extensions/extensions.routes.js";
import { createInstallerRouter } from "../modules/installer/installer.routes.js";
import { createSettingsRouter } from "../modules/settings/settings.routes.js";
import type { AppContext } from "./context.js";

export const registerAppRoutes = (
  app: Application,
  context: AppContext,
): void => {
  app.use("/api/catalog", createCatalogRouter(context));
  app.use("/api/extensions", createExtensionsRouter(context));
  app.use("/api/installer", createInstallerRouter(context));
  app.use("/api/settings", createSettingsRouter(context));
};
