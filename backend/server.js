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
import marketplaceRoutes from './routes/marketplace.js';
import { ensureRuntimeData } from './utils/seed.js';
import { initStore, isUsingPostgres, isUsingDatabase, getStorageMode } from './utils/store.js';
import { validateMercadoPago } from './services/mercadopago.js';
import { getPool } from './utils/store-pg.js';
import { getSqliteDb, getSqlitePath } from './utils/store-sqlite.js';

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
  process.env.SITE_URL,
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
app.use('/api/marketplace', marketplaceRoutes);

app.get('/api/health', async (_req, res) => {
  const mp = await validateMercadoPago();
  let database = { connected: false, mode: 'json', message: 'JSON local (fallback)' };

  if (isUsingPostgres()) {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      const { rows: userRows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
      const { rows: orderRows } = await pool.query('SELECT COUNT(*)::int AS count FROM orders');
      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '';
      const provider = /neon\.tech/i.test(dbUrl) ? 'neon' : 'postgres';
      database = {
        connected: true,
        mode: 'postgres',
        provider,
        message: `PostgreSQL OK (${provider}) — ${userRows[0].count} usuários, ${orderRows[0].count} pedidos`,
        users: userRows[0].count,
        orders: orderRows[0].count,
      };
    } catch (err) {
      database = { connected: false, mode: 'postgres', message: err.message };
    }
  } else if (isUsingDatabase()) {
    try {
      const sqlite = getSqliteDb();
      const users = sqlite.prepare('SELECT COUNT(*) AS count FROM users').get().count;
      const orders = sqlite.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
      database = {
        connected: true,
        mode: 'sqlite',
        message: `SQLite OK — ${users} usuários, ${orders} pedidos`,
        path: getSqlitePath(),
        users,
        orders,
      };
    } catch (err) {
      database = { connected: false, mode: 'sqlite', message: err.message };
    }
  }

  res.json({
    status: 'ok',
    name: 'Trampolim API',
    version: '1.4.0',
    environment: process.env.NODE_ENV || 'development',
    url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
    deploy: process.env.RENDER ? 'render' : 'local',
    storage: getStorageMode(),
    database,
    mercadopago: {
      configured: mp.configured,
      mode: mp.mode,
      message: mp.message || (mp.configured ? 'Ativo' : 'Simulado'),
    },
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

async function start() {
  if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-in-production') || process.env.JWT_SECRET.includes('dev-secret'))) {
    console.warn('⚠️  JWT_SECRET fraco ou padrão em produção — defina um segredo forte no Render.');
  }
  if (isProd && !(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL)) {
    console.warn('⚠️  Sem DATABASE_URL em produção — cadastros usarão SQLite do disco (não recomendado no Render free).');
  }

  await initStore();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Trampolim ${isProd ? 'PRODUCTION' : 'DEV'} → port ${PORT}`);
    console.log(`🌐 Site:  http://localhost:${PORT}`);
    console.log(`⚛️  React: http://localhost:${PORT}/app`);
    console.log(`📦 API:   http://localhost:${PORT}/api/health`);
    console.log(`🗄️  DB:    ${getStorageMode()}`);
  });
}

start().catch(err => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
