import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const jsonStore = {
  async getProducts() { return readJSON('products.json'); },
  async saveProducts(products) { writeJSON('products.json', products); return products; },
  async getCategories() { return readJSON('categories.json'); },
  async getCarousel() { return readJSON('carousel.json'); },
  async getUsers() { return readJSON('users.json'); },
  async saveUsers(users) { writeJSON('users.json', users); return users; },
  async getOrders() { return readJSON('orders.json'); },
  async saveOrders(orders) { writeJSON('orders.json', orders); return orders; },
  async getPayments() { return readJSON('payments.json'); },
  async savePayments(payments) { writeJSON('payments.json', payments); return payments; },

  async getMarketplaces() { return readJSON('marketplaces.json'); },
  async getListings() { return readJSON('listings.json'); },
  async saveListings(listings) { writeJSON('listings.json', listings); return listings; },
  async getSellers() { return readJSON('sellers.json'); },
  async saveSellers(sellers) { writeJSON('sellers.json', sellers); return sellers; },
  async getUserIdentities() { return readJSON('user-identities.json'); },
  async saveUserIdentities(data) { writeJSON('user-identities.json', data); return data; },
  async getHubTransactions() { return readJSON('hub-transactions.json'); },
  async saveHubTransactions(data) { writeJSON('hub-transactions.json', data); return data; },

  async getHubDeals() { return readJSON('hub-deals.json'); },
  async saveHubDeals(data) { writeJSON('hub-deals.json', data); return data; },

  async getFeeRules() {
    const filePath = path.join(DATA_DIR, 'fee-rules.json');
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  },

  async decrementStock(orderItems) {
    const products = readJSON('products.json');
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId || p.id === item.id);
      if (product) product.stock = Math.max(0, product.stock - (item.qty || 1));
    });
    writeJSON('products.json', products);
    return products;
  },
};
