import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsonStore } from './store-json.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'trampolim.db');

let db = null;

function parseAddress(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    phone: row.phone || '',
    cpf: row.cpf || '',
    birthdate: row.birthdate || '',
    address: parseAddress(row.address),
    createdAt: row.created_at,
  };
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export function initSqlite() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      cpf TEXT DEFAULT '',
      birthdate TEXT DEFAULT '',
      address TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL,
      shipping REAL DEFAULT 0,
      total REAL NOT NULL,
      payment TEXT DEFAULT 'pending',
      address TEXT DEFAULT '{}',
      customer TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      tracking_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_code);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      method TEXT,
      amount REAL,
      status TEXT,
      external_id TEXT,
      data TEXT DEFAULT '{}',
      created_at TEXT,
      approved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_external ON payments(external_id);
  `);

  migrateUsersFromJson();
  return true;
}

function migrateUsersFromJson() {
  try {
    const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    if (count > 0) return;

    const filePath = path.join(DATA_DIR, 'users.json');
    if (!fs.existsSync(filePath)) return;

    const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(users) || !users.length) return;

    const insert = db.prepare(`
      INSERT OR IGNORE INTO users
      (id, name, email, password, phone, cpf, birthdate, address, created_at)
      VALUES (@id, @name, @email, @password, @phone, @cpf, @birthdate, @address, @created_at)
    `);

    const tx = db.transaction((list) => {
      for (const user of list) {
        insert.run({
          id: user.id,
          name: user.name,
          email: String(user.email || '').toLowerCase(),
          password: user.password,
          phone: user.phone || '',
          cpf: user.cpf || '',
          birthdate: user.birthdate || '',
          address: JSON.stringify(user.address || {}),
          created_at: user.createdAt || new Date().toISOString(),
        });
      }
    });

    tx(users);
    console.log(`?? Migrados ${users.length} usuário(s) de users.json ? SQLite`);
  } catch (err) {
    console.warn('Aviso na migração JSON?SQLite:', err.message);
  }
}

export function getSqliteDb() {
  return db;
}

export function getSqlitePath() {
  return DB_PATH;
}

export const sqliteStore = {
  getProducts: () => jsonStore.getProducts(),
  saveProducts: (p) => jsonStore.saveProducts(p),
  getCategories: () => jsonStore.getCategories(),
  getCarousel: () => jsonStore.getCarousel(),
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
  decrementStock: (items) => jsonStore.decrementStock(items),

  async getUsers() {
    return db.prepare('SELECT * FROM users ORDER BY created_at').all().map(mapUser);
  },

  async saveUsers() {
    throw new Error('Use insertUser/updateUser for SQLite');
  },

  async insertUser(user) {
    db.prepare(`
      INSERT INTO users (id, name, email, password, phone, cpf, birthdate, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.name,
      user.email,
      user.password,
      user.phone || '',
      user.cpf || '',
      user.birthdate || '',
      JSON.stringify(user.address || {}),
      user.createdAt || new Date().toISOString()
    );
    return user;
  },

  async updateUser(user) {
    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone = ?, cpf = ?, birthdate = ?, address = ?, password = COALESCE(?, password)
      WHERE id = ?
    `).run(
      user.name,
      user.email,
      user.phone || '',
      user.cpf || '',
      user.birthdate || '',
      JSON.stringify(user.address || {}),
      user.password || null,
      user.id
    );
    return this.findUserById(user.id);
  },

  async findUserByEmail(email) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
    return mapUser(row);
  },

  async findUserById(id) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return mapUser(row);
  },

  async findUserByCpf(cpf) {
    const digits = String(cpf || '').replace(/\D/g, '');
    if (!digits) return null;
    const row = db.prepare('SELECT * FROM users WHERE cpf = ?').get(digits);
    return mapUser(row);
  },

  async getOrders() {
    return db.prepare('SELECT * FROM orders ORDER BY created_at').all().map(mapOrder);
  },

  async saveOrders() {
    throw new Error('Use insertOrder/updateOrder for SQLite');
  },

  async insertOrder(order) {
    db.prepare(`
      INSERT INTO orders
      (id, user_id, items, subtotal, shipping, total, payment, address, customer, status, tracking_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.id,
      order.userId || null,
      JSON.stringify(order.items || []),
      order.subtotal,
      order.shipping || 0,
      order.total,
      order.payment || 'pending',
      JSON.stringify(order.address || {}),
      JSON.stringify(order.customer || {}),
      order.status || 'pending',
      order.trackingCode || null,
      order.createdAt || new Date().toISOString()
    );
    return order;
  },

  async updateOrder(order) {
    db.prepare(`
      UPDATE orders
      SET items = ?, subtotal = ?, shipping = ?, total = ?, payment = ?, address = ?,
          customer = ?, status = ?, tracking_code = ?
      WHERE id = ?
    `).run(
      JSON.stringify(order.items || []),
      order.subtotal,
      order.shipping || 0,
      order.total,
      order.payment || 'pending',
      JSON.stringify(order.address || {}),
      JSON.stringify(order.customer || {}),
      order.status || 'pending',
      order.trackingCode || null,
      order.id
    );
    return order;
  },

  async findOrderById(id) {
    return mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  },

  async findOrderByTracking(code) {
    return mapOrder(db.prepare('SELECT * FROM orders WHERE tracking_code = ?').get(code));
  },

  async getOrdersByUser(userId) {
    return db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(mapOrder);
  },

  async getPayments() {
    return db.prepare('SELECT * FROM payments ORDER BY created_at').all().map(mapPayment);
  },

  async savePayments() {
    throw new Error('Use insertPayment/updatePayment for SQLite');
  },

  async insertPayment(payment) {
    const { externalId, ...rest } = payment;
    db.prepare(`
      INSERT INTO payments (id, order_id, method, amount, status, external_id, data, created_at, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payment.id,
      payment.orderId,
      payment.method,
      payment.amount,
      payment.status,
      externalId || null,
      JSON.stringify(rest),
      payment.createdAt || new Date().toISOString(),
      payment.approvedAt || null
    );
    return payment;
  },

  async updatePayment(payment) {
    const existing = db.prepare('SELECT data FROM payments WHERE id = ?').get(payment.id);
    const data = { ...(existing ? parseAddress(existing.data) : {}), ...payment };
    db.prepare(`
      UPDATE payments SET status = ?, external_id = ?, data = ?, approved_at = ? WHERE id = ?
    `).run(
      payment.status,
      payment.externalId || null,
      JSON.stringify(data),
      payment.approvedAt || null,
      payment.id
    );
    return payment;
  },

  async findPaymentById(id) {
    return mapPayment(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
  },

  async findPaymentByExternalId(externalId) {
    return mapPayment(db.prepare('SELECT * FROM payments WHERE external_id = ?').get(String(externalId)));
  },
};

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    items: parseAddress(row.items) || [],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    payment: row.payment,
    address: parseAddress(row.address),
    customer: parseAddress(row.customer),
    status: row.status,
    trackingCode: row.tracking_code,
    createdAt: row.created_at,
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
    ...parseAddress(row.data),
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

export { publicUser };
