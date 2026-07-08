import { initDatabase } from './store-pg.js';
import { jsonStore } from './store-json.js';
import { pgStore } from './store-pg.js';

let activeStore = jsonStore;
let usingPostgres = false;

export async function initStore() {
  usingPostgres = await initDatabase();
  if (usingPostgres) {
    activeStore = pgStore;
    console.log('🐘 PostgreSQL conectado');
  } else {
    console.log('📁 Armazenamento JSON (desenvolvimento)');
  }
  return usingPostgres;
}

export function isUsingPostgres() {
  return usingPostgres;
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
  findUserByEmail: (...a) => activeStore.findUserByEmail?.(...a),
  findUserById: (...a) => activeStore.findUserById?.(...a),
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
