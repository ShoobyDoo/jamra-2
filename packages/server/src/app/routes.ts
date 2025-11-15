import type { Application } from "express";
import { createCatalogRouter } from "../modules/catalog/catalog.routes.js";
import { createExtensionsRouter } from "../modules/extensions/extensions.routes.js";
import { createInstallerRouter } from "../modules/installer/installer.routes.js";
import { createLibraryRouter } from "../modules/library/library.routes.js";
import { createDownloadsRouter } from "../modules/downloads/downloads.routes.js";
import { createSettingsRouter } from "../modules/settings/settings.routes.js";
import { createReaderRouter } from "../modules/reader/reader.routes.js";
import type { AppContext } from "./context.js";

export const registerAppRoutes = (
  app: Application,
  context: AppContext,
): void => {
  app.use("/api/catalog", createCatalogRouter(context));
  app.use("/api/extensions", createExtensionsRouter(context));
  app.use("/api/installer", createInstallerRouter(context));
  app.use("/api/library", createLibraryRouter(context));
  app.use("/api/downloads", createDownloadsRouter(context));
  app.use("/api/settings", createSettingsRouter(context));
  app.use("/api/reader", createReaderRouter(context));
};
