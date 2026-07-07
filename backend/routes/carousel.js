import { Router } from 'express';
import { store } from '../utils/store.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await store.getCarousel());
});

export default router;
