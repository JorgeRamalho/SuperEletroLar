import { initDatabase, pgStore } from './store-pg.js';
import { jsonStore } from './store-json.js';
import { initSqlite, sqliteStore, getSqlitePath } from './store-sqlite.js';

let activeStore = jsonStore;
let storageMode = 'json';

export async function initStore() {
  const usingPostgres = await initDatabase();

  if (usingPostgres) {
    activeStore = pgStore;
    storageMode = 'postgres';
    console.log('🐘 PostgreSQL conectado');
    return storageMode;
  }

  try {
    initSqlite();
    activeStore = sqliteStore;
    storageMode = 'sqlite';
    console.log(`🗄️  SQLite conectado → ${getSqlitePath()}`);
    return storageMode;
  } catch (err) {
    activeStore = jsonStore;
    storageMode = 'json';
    console.warn('⚠️  SQLite indisponível, usando JSON:', err.message);
    console.log('📁 Armazenamento JSON (fallback)');
    return storageMode;
  }
}

export function isUsingPostgres() {
  return storageMode === 'postgres';
}

export function isUsingDatabase() {
  return storageMode === 'postgres' || storageMode === 'sqlite';
}

export function getStorageMode() {
  return storageMode;
}

export const store = {
  getProducts: (...a) => activeStore.getProducts(...a),
  saveProducts: (...a) => activeStore.saveProducts(...a),
  getCategories: (...a) => activeStore.getCategories(...a),
  getCarousel: (...a) => activeStore.getCarousel(...a),
  getUsers: (...a) => activeStore.getUsers(...a),
  saveUsers: (...a) => activeStore.saveUsers(...a),
  getOrders: (...a) => activeStore.getOrders(...a),
  saveOrders: (...a) => activeStore.saveOrders(...a),
  getPayments: (...a) => activeStore.getPayments(...a),
  savePayments: (...a) => activeStore.savePayments(...a),
  decrementStock: (...a) => activeStore.decrementStock(...a),

  insertUser: (...a) => activeStore.insertUser?.(...a),
  updateUser: (...a) => activeStore.updateUser?.(...a),
  findUserByEmail: (...a) => activeStore.findUserByEmail?.(...a),
  findUserById: (...a) => activeStore.findUserById?.(...a),
  findUserByCpf: (...a) => activeStore.findUserByCpf?.(...a),
  insertOrder: (...a) => activeStore.insertOrder?.(...a),
  updateOrder: (...a) => activeStore.updateOrder?.(...a),
  findOrderById: (...a) => activeStore.findOrderById?.(...a),
  findOrderByTracking: (...a) => activeStore.findOrderByTracking?.(...a),
  getOrdersByUser: (...a) => activeStore.getOrdersByUser?.(...a),
  insertPayment: (...a) => activeStore.insertPayment?.(...a),
  updatePayment: (...a) => activeStore.updatePayment?.(...a),
  findPaymentById: (...a) => activeStore.findPaymentById?.(...a),
  findPaymentByExternalId: (...a) => activeStore.findPaymentByExternalId?.(...a),

  getMarketplaces: (...a) => activeStore.getMarketplaces(...a),
  getListings: (...a) => activeStore.getListings(...a),
  saveListings: (...a) => activeStore.saveListings(...a),
  getSellers: (...a) => activeStore.getSellers(...a),
  saveSellers: (...a) => activeStore.saveSellers(...a),
  getUserIdentities: (...a) => activeStore.getUserIdentities(...a),
  saveUserIdentities: (...a) => activeStore.saveUserIdentities(...a),
  getHubTransactions: (...a) => activeStore.getHubTransactions(...a),
  saveHubTransactions: (...a) => activeStore.saveHubTransactions(...a),
  getHubDeals: (...a) => activeStore.getHubDeals(...a),
  saveHubDeals: (...a) => activeStore.saveHubDeals(...a),
  getFeeRules: (...a) => activeStore.getFeeRules(...a),
};
