import { Router } from "express";

const router = Router();

// GET /api/manga - Get all manga
router.get("/", async (req, res) => {
  // TODO: Implement
  res.json([]);
});

// GET /api/manga/:id - Get manga by ID
router.get("/:id", async (req, res) => {
  // TODO: Implement
  res.json(null);
});

// POST /api/manga - Create manga
router.post("/", async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: "Not implemented" });
});

// PUT /api/manga/:id - Update manga
router.put("/:id", async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: "Not implemented" });
});

// DELETE /api/manga/:id - Delete manga
router.delete("/:id", async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: "Not implemented" });
});

export default router;
