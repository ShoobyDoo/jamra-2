import { Router } from 'express';

const router = Router();

// GET /api/downloads - Get download queue
router.get('/', async (req, res) => {
  // TODO: Implement
  res.json([]);
});

// POST /api/downloads - Add to download queue
router.post('/', async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/downloads/:id - Remove from download queue
router.delete('/:id', async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

// PUT /api/downloads/:id/progress - Update download progress
router.put('/:id/progress', async (req, res) => {
  // TODO: Implement
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
