import pg from 'pg';
import { jsonStore } from './store-json.js';

const { Pool } = pg;
let pool = null;

export async function initDatabase() {
  if (!process.env.DATABASE_URL) return false;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      items JSONB NOT NULL DEFAULT '[]',
      subtotal NUMERIC(12,2) NOT NULL,
      shipping NUMERIC(12,2) DEFAULT 0,
      total NUMERIC(12,2) NOT NULL,
      payment TEXT DEFAULT 'pending',
      address JSONB DEFAULT '{}',
      customer JSONB DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      tracking_code TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      method TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      external_id TEXT,
      data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      approved_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_code);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_external ON payments(external_id);
  `);

  return true;
}

export function getPool() {
  return pool;
}

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    items: row.items,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    payment: row.payment,
    address: row.address,
    customer: row.customer,
    status: row.status,
    trackingCode: row.tracking_code,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    method: row.method,
    amount: Number(row.amount),
    status: row.status,
    externalId: row.external_id,
    ...row.data,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    approvedAt: row.approved_at?.toISOString?.() || row.approved_at,
  };
}

export const pgStore = {
  getProducts: () => jsonStore.getProducts(),
  saveProducts: (p) => jsonStore.saveProducts(p),
  getCategories: () => jsonStore.getCategories(),
  getCarousel: () => jsonStore.getCarousel(),
  decrementStock: (items) => jsonStore.decrementStock(items),

  async getUsers() {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at');
    return rows.map(r => ({
      id: r.id, name: r.name, email: r.email, password: r.password,
      phone: r.phone, createdAt: r.created_at?.toISOString?.() || r.created_at,
    }));
  },

  async saveUsers() {
    throw new Error('Use insertUser for PostgreSQL');
  },

  async insertUser(user) {
    await pool.query(
      'INSERT INTO users (id, name, email, password, phone, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [user.id, user.name, user.email, user.password, user.phone || '', user.createdAt || new Date().toISOString()]
    );
    return user;
  },

  async findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const r = rows[0];
    if (!r) return null;
    return { id: r.id, name: r.name, email: r.email, password: r.password, phone: r.phone };
  },

  async findUserById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const r = rows[0];
    if (!r) return null;
    return { id: r.id, name: r.name, email: r.email, password: r.password, phone: r.phone };
  },

  async getOrders() {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at');
    return rows.map(mapOrder);
  },

  async saveOrders() {
    throw new Error('Use insertOrder/updateOrder for PostgreSQL');
  },

  async insertOrder(order) {
    await pool.query(
      `INSERT INTO orders (id, user_id, items, subtotal, shipping, total, payment, address, customer, status, tracking_code, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [order.id, order.userId, JSON.stringify(order.items), order.subtotal, order.shipping,
        order.total, order.payment, JSON.stringify(order.address), JSON.stringify(order.customer),
        order.status, order.trackingCode, order.createdAt]
    );
    return order;
  },

  async updateOrder(order) {
    await pool.query(
      `UPDATE orders SET status=$2, payment=$3, tracking_code=$4 WHERE id=$1`,
      [order.id, order.status, order.payment, order.trackingCode]
    );
    return order;
  },

  async findOrderById(id) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return mapOrder(rows[0]);
  },

  async findOrderByTracking(code) {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR tracking_code = $1', [code]
    );
    return mapOrder(rows[0]);
  },

  async getOrdersByUser(userId) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows.map(mapOrder);
  },

  async getPayments() {
    const { rows } = await pool.query('SELECT * FROM payments ORDER BY created_at');
    return rows.map(mapPayment);
  },

  async savePayments() {
    throw new Error('Use insertPayment/updatePayment for PostgreSQL');
  },

  async insertPayment(payment) {
    const { externalId, pixCode, pixQrCode, expiresAt, sandbox, message, checkoutUrl,
      installments, cardLastFour, ...rest } = payment;
    const data = { pixCode, pixQrCode, expiresAt, sandbox, message, checkoutUrl, installments, cardLastFour, ...rest };
    await pool.query(
      `INSERT INTO payments (id, order_id, method, amount, status, external_id, data, created_at, approved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [payment.id, payment.orderId, payment.method, payment.amount, payment.status,
        externalId || null, JSON.stringify(data), payment.createdAt, payment.approvedAt || null]
    );
    return payment;
  },

  async updatePayment(payment) {
    const { rows } = await pool.query('SELECT data FROM payments WHERE id = $1', [payment.id]);
    const data = { ...(rows[0]?.data || {}), ...payment };
    await pool.query(
      'UPDATE payments SET status=$2, external_id=$3, data=$4, approved_at=$5 WHERE id=$1',
      [payment.id, payment.status, payment.externalId || null, JSON.stringify(data), payment.approvedAt || null]
    );
    return payment;
  },

  async findPaymentById(id) {
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    return mapPayment(rows[0]);
  },

  async findPaymentByExternalId(externalId) {
    const { rows } = await pool.query('SELECT * FROM payments WHERE external_id = $1', [String(externalId)]);
    return mapPayment(rows[0]);
  },

  getMarketplaces: () => jsonStore.getMarketplaces(),
  getListings: () => jsonStore.getListings(),
  saveListings: (l) => jsonStore.saveListings(l),
  getSellers: () => jsonStore.getSellers(),
  saveSellers: (s) => jsonStore.saveSellers(s),
  getUserIdentities: () => jsonStore.getUserIdentities(),
  saveUserIdentities: (d) => jsonStore.saveUserIdentities(d),
  getHubTransactions: () => jsonStore.getHubTransactions(),
  saveHubTransactions: (d) => jsonStore.saveHubTransactions(d),
  getHubDeals: () => jsonStore.getHubDeals(),
  saveHubDeals: (d) => jsonStore.saveHubDeals(d),
  getFeeRules: () => jsonStore.getFeeRules(),
};
