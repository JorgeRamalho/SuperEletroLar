import { Router } from 'express';
import { store } from '../utils/store.js';

const router = Router();

router.get('/', async (req, res) => {
  const products = await store.getProducts();
  const { category, search, minPrice, maxPrice, sort } = req.query;

  let filtered = [...products];

  if (category) filtered = filtered.filter(p => p.category === category);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));

  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  res.json(filtered);
});

router.get('/:id', async (req, res) => {
  const products = await store.getProducts();
  const product = products.find(p => p.id === Number(req.params.id) || p.slug === req.params.id);

  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({ ...product, related });
});

export default router;
