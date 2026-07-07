import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import cepRoutes from './routes/cep.js';
import carouselRoutes from './routes/carousel.js';
import { ensureRuntimeData } from './utils/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
ensureRuntimeData();
const ROOT = path.join(__dirname, '..');
const REACT_DIST = path.join(ROOT, 'react', 'dist');
const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || !isProd) {
      callback(null, true);
    } else {
      callback(null, allowedOrigins.some(o => origin.startsWith(o.replace(/\/$/, ''))));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cep', cepRoutes);
app.use('/api/carousel', carouselRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'SuperEletroLar API',
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development',
    url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
    deploy: process.env.RENDER ? 'render' : 'local',
  });
});

app.use(express.static(ROOT, {
  index: false,
  maxAge: isProd ? '1d' : 0,
}));

app.use('/app', express.static(REACT_DIST, {
  maxAge: isProd ? '1d' : 0,
}));

app.get('/app/*', (_req, res) => {
  res.sendFile(path.join(REACT_DIST, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(ROOT, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ SuperEletroLar ${isProd ? 'PRODUCTION' : 'DEV'} → port ${PORT}`);
  console.log(`🌐 Site:  http://localhost:${PORT}`);
  console.log(`⚛️  React: http://localhost:${PORT}/app`);
  console.log(`📦 API:   http://localhost:${PORT}/api/health`);
});
