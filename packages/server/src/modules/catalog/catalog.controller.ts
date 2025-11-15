import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors.js";
import type { CatalogService } from "./catalog.service.js";

export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  list = (_req: Request, res: Response): void => {
    try {
      const repoId =
        typeof _req.query?.repoId === "string" ? _req.query.repoId : undefined;
      const entries = this.service.listEntries(repoId);
      res.json({ entries });
    } catch (_error) {
      res.status(500).json({ message: "Failed to load catalog entries." });
    }
  };

  sync = async (req: Request, res: Response): Promise<void> => {
    try {
      const repoId =
        typeof req.body?.repoId === "string" ? req.body.repoId : undefined;
      const result = await this.service.syncCatalog(repoId);
      res.status(202).json({ status: "sync queued", repoId, result });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Failed to sync catalog." });
    }
  };
}
