import type { Request, Response } from "express";
import type { LibraryService } from "./library.service.js";
import type {
  CreateLibraryItemInput,
  UpdateLibraryItemInput,
  LibraryFilters,
  LibrarySort,
  PaginationOptions,
  UpsertProgressInput,
  LibraryStatus,
} from "./library.types.js";

export class LibraryController {
  constructor(private readonly service: LibraryService) {}

  // GET /api/library - List library items
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: LibraryFilters = {};
      const sort: LibrarySort = {
        field: "lastUpdated",
        direction: "desc",
      };
      const pagination: PaginationOptions = {};

      // Parse filters from query params
      if (req.query.status) {
        filters.status = req.query.status as LibraryStatus;
      }

      if (req.query.favorite) {
        filters.favorite = req.query.favorite === "true";
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      // Parse sort
      if (req.query.sort) {
        sort.field = req.query.sort as LibrarySort["field"];
      }

      if (req.query.direction) {
        sort.direction = req.query.direction as "asc" | "desc";
      }

      // Parse pagination
      if (req.query.limit) {
        pagination.limit = parseInt(req.query.limit as string, 10);
      }

      if (req.query.offset) {
        pagination.offset = parseInt(req.query.offset as string, 10);
      }

      const result = await this.service.listLibraryItems(
        filters,
        sort,
        pagination,
      );

      res.json({
        items: result.items,
        total: result.total,
        limit: pagination.limit,
        offset: pagination.offset || 0,
      });
    } catch (error) {
      console.error("Error listing library items:", error);
      throw error;
    }
  };

  // POST /api/library - Add manga to library
  add = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body as CreateLibraryItemInput;

      // Validate required fields
      if (!input.mangaId) {
        res.status(400).json({ message: "mangaId is required" });
        return;
      }

      if (!input.extensionId) {
        res.status(400).json({ message: "extensionId is required" });
        return;
      }

      if (!input.title) {
        res.status(400).json({ message: "title is required" });
        return;
      }

      if (!input.status) {
        res.status(400).json({ message: "status is required" });
        return;
      }

      const item = await this.service.addToLibrary(input);

      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding to library:", error);
      throw error;
    }
  };

  // GET /api/library/:id - Get library item details
  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      const item = await this.service.getLibraryItem(id);

      res.json(item);
    } catch (error) {
      console.error("Error getting library item:", error);
      throw error;
    }
  };

  // PATCH /api/library/:id - Update library item
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body as UpdateLibraryItemInput;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      const item = await this.service.updateLibraryItem(id, input);

      res.json(item);
    } catch (error) {
      console.error("Error updating library item:", error);
      throw error;
    }
  };

  // DELETE /api/library/:id - Remove from library
  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      await this.service.removeFromLibrary(id);

      res.status(204).send();
    } catch (error) {
      console.error("Error removing from library:", error);
      throw error;
    }
  };

  // PATCH /api/library/:id/favorite - Toggle favorite
  toggleFavorite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      const item = await this.service.toggleFavorite(id);

      res.json(item);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  };

  // GET /api/library/:id/progress - Get all progress for manga
  getAllProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      const progress = await this.service.getAllProgress(id);

      res.json(progress);
    } catch (error) {
      console.error("Error getting progress:", error);
      throw error;
    }
  };

  // PUT /api/library/:id/progress - Update reading progress
  updateProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body as Omit<UpsertProgressInput, "libraryId">;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      if (!body.chapterId) {
        res.status(400).json({ message: "chapterId is required" });
        return;
      }

      if (body.pageNumber === undefined) {
        res.status(400).json({ message: "pageNumber is required" });
        return;
      }

      const input: UpsertProgressInput = {
        libraryId: id,
        chapterId: body.chapterId,
        chapterNumber: body.chapterNumber,
        pageNumber: body.pageNumber,
        totalPages: body.totalPages,
      };

      const progress = await this.service.updateProgress(input);

      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      throw error;
    }
  };

  // GET /api/library/:id/chapters/:chapterId/progress - Get specific chapter progress
  getChapterProgress = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id, chapterId } = req.params;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      if (!chapterId) {
        res.status(400).json({ message: "chapterId is required" });
        return;
      }

      const progress = await this.service.getProgress(id, chapterId);

      if (!progress) {
        res.status(404).json({ message: "Progress not found" });
        return;
      }

      res.json(progress);
    } catch (error) {
      console.error("Error getting chapter progress:", error);
      throw error;
    }
  };

  // GET /api/library/:id/last-read - Get last read chapter
  getLastRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "id is required" });
        return;
      }

      const progress = await this.service.getLastRead(id);

      if (!progress) {
        res.status(404).json({ message: "No reading history found" });
        return;
      }

      res.json(progress);
    } catch (error) {
      console.error("Error getting last read:", error);
      throw error;
    }
  };

  // GET /api/library/stats - Get library statistics
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getLibraryStats();

      res.json(stats);
    } catch (error) {
      console.error("Error getting library stats:", error);
      throw error;
    }
  };
}
