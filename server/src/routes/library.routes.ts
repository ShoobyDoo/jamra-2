import { Router } from 'express';

const router = Router();

// GET /api/library - Get all library items
router.get('/', async (req, res) => {
  // TODO: Implement
  res.json([]);
});

// POST /api/library - Add manga to library
router.post('/', async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/library/:mangaId - Remove manga from library
router.delete('/:mangaId', async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/library/progress/:mangaId - Get reading progress
router.get('/progress/:mangaId', async (req, res) => {
  // TODO: Implement
  res.json(null);
});

// PUT /api/library/progress - Update reading progress
router.put('/progress', async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
