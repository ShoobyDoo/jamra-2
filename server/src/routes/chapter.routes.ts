import { Router } from "express";

const router = Router();

// GET /api/chapters - Get all chapters (with optional mangaId filter)
router.get("/", async (req, res) => {
  // TODO: Implement (check for ?mangaId query param)
  res.json([]);
});

// GET /api/chapters/:id - Get chapter by ID
router.get("/:id", async (req, res) => {
  // TODO: Implement
  res.json(null);
});

// POST /api/chapters - Create chapter
router.post("/", async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/chapters/:id - Delete chapter
router.delete("/:id", async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: "Not implemented" });
});

export default router;
