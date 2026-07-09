/**
 * Trampolim — API Client
 */

const API_BASE = (() => {
  const { hostname, port, protocol } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocal || port === '4000' || port === '' || port === '80' || port === '443') {
    return '/api';
  }
  return `${protocol}//${hostname}:4000/api`;
})();

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('sel-token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('sel-token', token);
    else localStorage.removeItem('sel-token');
  }

  getUser() {
    const data = localStorage.getItem('sel-user');
    return data ? JSON.parse(data) : null;
  }

  setUser(user) {
    if (user) localStorage.setItem('sel-user', JSON.stringify(user));
    else localStorage.removeItem('sel-user');
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
    return data;
  }

  /* Auth */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async register(data) {
    const payload = data && typeof data === 'object' && !Array.isArray(data)
      ? data
      : { name: data, email: arguments[1], password: arguments[2], phone: arguments[3] };
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(result.token);
    this.setUser(result.user);
    return result;
  }

  logout() {
    this.setToken(null);
    this.setUser(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    const user = await this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.setUser(user);
    return user;
  }

  /* Products */
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async getCategories() {
    return this.request('/categories');
  }

  async getCarousel() {
    return this.request('/carousel');
  }

  async getCep(cep) {
    return this.request(`/cep/${cep.replace(/\D/g, '')}`);
  }

  /* Orders */
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async trackOrder(code) {
    return this.request(`/orders/track/${code}`);
  }

  /* Payments */
  async createPixPayment(orderId, amount) {
    return this.request('/payments/pix', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
  }

  async confirmPixPayment(paymentId) {
    return this.request('/payments/pix/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
  }

  async payWithCard(cardData) {
    return this.request('/payments/card', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  async payWithMercadoPago(orderId, amount, paymentMethod = 'pix') {
    return this.request('/payments/mercadopago', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, paymentMethod }),
    });
  }

  /* Marketplace Hub */
  async getMarketplacePlatforms() {
    return this.request('/marketplace/platforms');
  }

  async searchMarketplace(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/marketplace/search${query ? `?${query}` : ''}`);
  }

  async getHubListing(id) {
    return this.request(`/marketplace/listings/${id}`);
  }

  async registerHubSeller(data) {
    return this.request('/marketplace/sellers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createHubListing(data) {
    return this.request('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async linkHubIdentity(data) {
    return this.request('/marketplace/identities/link', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHubProfile() {
    return this.request('/marketplace/profile');
  }

  async getHubAnalytics() {
    return this.request('/marketplace/analytics');
  }

  async recordHubTransaction(data) {
    return this.request('/marketplace/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFeeRules() {
    return this.request('/marketplace/fee-rules');
  }

  async getFeePreview(listingId, amount) {
    const params = new URLSearchParams({ listingId });
    if (amount != null) params.set('amount', amount);
    return this.request(`/marketplace/fee-preview?${params}`);
  }

  async createHubDeal(data) {
    return this.request('/marketplace/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async payHubDeal(dealId, data = {}) {
    return this.request(`/marketplace/deals/${dealId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmHubDeal(dealId) {
    return this.request(`/marketplace/deals/${dealId}/confirm`, {
      method: 'POST',
    });
  }

  async getHubDeal(id) {
    return this.request(`/marketplace/deals/${id}`);
  }

  async getMyHubDeals() {
    return this.request('/marketplace/deals/mine');
  }
}

window.api = new ApiClient();
