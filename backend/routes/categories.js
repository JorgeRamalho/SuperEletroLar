import { Router } from 'express';
import { store } from '../utils/store.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await store.getCategories());
});

router.get('/:id', async (req, res) => {
  const categories = await store.getCategories();
  const category = categories.find(c => c.id === req.params.id);
  if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });

  const products = (await store.getProducts()).filter(p => p.category === category.id);
  res.json({ ...category, products });
});

export default router;
