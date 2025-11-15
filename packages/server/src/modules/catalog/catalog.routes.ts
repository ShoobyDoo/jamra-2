import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { CatalogController } from "./catalog.controller.js";
import { createCatalogRepository } from "./catalog.repository.js";
import { createCatalogService } from "./catalog.service.js";
import { FilesystemCatalogDriver } from "./drivers/filesystem-driver.js";
import { HttpCatalogDriver } from "./drivers/http-driver.js";

export const createCatalogRouter = (context: AppContext): Router => {
  const router = Router();
  const repository = createCatalogRepository(context.db);
  const drivers = context.config.catalog.drivers.map((key) => {
    if (key === "http") {
      return new HttpCatalogDriver(context.httpClient);
    }
    return new FilesystemCatalogDriver();
  });
  const service = createCatalogService({
    repository,
    drivers,
    config: context.config.catalog,
  });
  const controller = new CatalogController(service);

  router.get("/", controller.list);
  router.post("/sync", controller.sync);

  return router;
};
