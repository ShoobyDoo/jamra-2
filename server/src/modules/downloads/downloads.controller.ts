import type { Request, Response } from "express";
import type { DownloadsService } from "./downloads.service.js";
import type {
  CreateDownloadInput,
  DownloadFilters,
  DownloadStatus,
} from "./downloads.types.js";

export class DownloadsController {
  constructor(private readonly service: DownloadsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: DownloadFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as DownloadStatus;
      }

      if (req.query.libraryId) {
        filters.libraryId = req.query.libraryId as string;
      }

      if (req.query.extensionId) {
        filters.extensionId = req.query.extensionId as string;
      }

      const downloads = await this.service.listDownloads(filters);
      res.json({ downloads });
    } catch (error) {
      console.error("Error listing downloads:", error);
      throw error;
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateDownloadInput;
      if (!body?.libraryId) {
        res.status(400).json({ message: "libraryId is required" });
        return;
      }

      if (!body?.extensionId) {
        res.status(400).json({ message: "extensionId is required" });
        return;
      }

      if (!Array.isArray(body?.chapterIds) || body.chapterIds.length === 0) {
        res.status(400).json({ message: "chapterIds must be a non-empty array" });
        return;
      }

      const downloads = await this.service.queueDownloads(body);
      res.status(202).json({ downloads });
    } catch (error) {
      console.error("Error queueing downloads:", error);
      throw error;
    }
  };

  detail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      const result = await this.service.getDownloadWithPages(id);
      if (!result) {
        res.status(404).json({ message: "Download not found" });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching download details:", error);
      throw error;
    }
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      await this.service.cancelDownload(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error cancelling download:", error);
      throw error;
    }
  };

  stats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error retrieving download stats:", error);
      throw error;
    }
  };
}
