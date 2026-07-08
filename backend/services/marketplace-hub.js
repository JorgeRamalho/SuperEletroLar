import { store } from '../utils/store.js';

const CONDITION_LABELS = {
  new: 'Novo',
  semi_used: 'Semi-novo',
  used: 'Usado',
  service: 'Serviço',
};

const SORT_FNS = {
  relevance: (a, b) => (b.views || 0) - (a.views || 0),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
};

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function normalizeEmail(email) {
  return (email || '').toLowerCase().trim();
}

function productToListing(product) {
  return {
    id: `retail-${product.id}`,
    title: product.name,
    slug: product.slug,
    description: product.description,
    marketplaceId: 'trampolim',
    sellerId: 'tramp-official',
    listingType: 'product',
    condition: 'new',
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice || null,
    currency: 'BRL',
    image: product.image,
    images: product.images || [product.image],
    location: { city: 'São Paulo', state: 'SP' },
    externalUrl: null,
    externalId: `SEL-${product.id}`,
    status: product.stock > 0 ? 'active' : 'sold',
    views: product.reviews || 0,
    rating: product.rating,
    badge: product.badge,
    stock: product.stock,
    freeShipping: product.freeShipping,
    isRetail: true,
    productId: product.id,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

function enrichListing(listing, marketplaces, sellers) {
  const mp = marketplaces.find(m => m.id === listing.marketplaceId) || {};
  const seller = sellers.find(s => s.id === listing.sellerId) || {};
  return {
    ...listing,
    conditionLabel: CONDITION_LABELS[listing.condition] || listing.condition,
    marketplace: {
      id: mp.id,
      name: mp.name,
      slug: mp.slug,
      color: mp.color,
      textColor: mp.textColor,
      icon: mp.icon,
    },
    seller: {
      id: seller.id,
      name: seller.name,
      verified: seller.verified,
      rating: seller.rating,
      salesCount: seller.salesCount,
      location: seller.location,
    },
  };
}

export async function getAllListings() {
  const [listings, products, marketplaces, sellers] = await Promise.all([
    store.getListings(),
    store.getProducts(),
    store.getMarketplaces(),
    store.getSellers(),
  ]);

  const retailListings = products.map(productToListing);
  const merged = [...retailListings, ...listings.filter(l => l.status === 'active')];
  return merged.map(l => enrichListing(l, marketplaces, sellers));
}

export async function searchHub(params = {}) {
  const {
    q = '',
    marketplace = '',
    condition = '',
    listingType = '',
    category = '',
    minPrice,
    maxPrice,
    state = '',
    city = '',
    sort = 'relevance',
    page = 1,
    limit = 24,
  } = params;

  let results = await getAllListings();
  const query = q.toLowerCase().trim();

  if (query) {
    results = results.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query)
    );
  }

  if (marketplace) {
    results = results.filter(item => item.marketplaceId === marketplace);
  }

  if (condition) {
    results = results.filter(item => item.condition === condition);
  }

  if (listingType) {
    results = results.filter(item => item.listingType === listingType);
  }

  if (category) {
    results = results.filter(item => item.category === category);
  }

  if (minPrice != null && minPrice !== '') {
    results = results.filter(item => item.price >= Number(minPrice));
  }

  if (maxPrice != null && maxPrice !== '') {
    results = results.filter(item => item.price <= Number(maxPrice));
  }

  if (state) {
    results = results.filter(item =>
      item.location?.state?.toLowerCase() === state.toLowerCase()
    );
  }

  if (city) {
    results = results.filter(item =>
      item.location?.city?.toLowerCase().includes(city.toLowerCase())
    );
  }

  const sortFn = SORT_FNS[sort] || SORT_FNS.relevance;
  results.sort(sortFn);

  const total = results.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;
  const items = results.slice(offset, offset + limitNum);

  const facets = buildFacets(await getAllListings(), results);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
    facets,
  };
}

function buildFacets(all, filtered) {
  const countBy = (arr, key) => {
    const map = {};
    arr.forEach(item => {
      const val = item[key];
      if (val) map[val] = (map[val] || 0) + 1;
    });
    return map;
  };

  return {
    marketplaces: countBy(all, 'marketplaceId'),
    conditions: countBy(all, 'condition'),
    listingTypes: countBy(all, 'listingType'),
    filteredTotal: filtered.length,
    totalCatalog: all.length,
  };
}

export async function getListingById(id) {
  const all = await getAllListings();
  return all.find(l => l.id === id || l.slug === id) || null;
}

export async function registerSeller(userId, data) {
  const sellers = await store.getSellers();
  const existing = sellers.find(s => s.userId === userId);
  if (existing) return { seller: existing, created: false };

  const seller = {
    id: `seller-${Date.now()}`,
    userId,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    marketplaceId: 'trampolim',
    externalId: `SEL-USER-${userId.slice(0, 8)}`,
    verified: false,
    rating: 0,
    salesCount: 0,
    location: data.location || { city: '', state: '' },
    bio: data.bio || '',
    createdAt: new Date().toISOString(),
  };

  sellers.push(seller);
  await store.saveSellers(sellers);
  await crossReferenceUser(userId, seller);
  return { seller, created: true };
}

export async function createListing(userId, data) {
  const sellers = await store.getSellers();
  let seller = sellers.find(s => s.userId === userId);
  if (!seller) {
    const users = await store.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    const reg = await registerSeller(userId, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: data.location,
    });
    seller = reg.seller;
  }

  const listings = await store.getListings();
  const listing = {
    id: `lst-user-${Date.now()}`,
    title: data.title,
    slug: data.title.toLowerCase().replace(/\s+/g, '-').slice(0, 60),
    description: data.description || '',
    marketplaceId: 'trampolim',
    sellerId: seller.id,
    listingType: data.listingType || 'product',
    condition: data.condition || 'used',
    category: data.category || 'geral',
    price: Number(data.price),
    oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
    currency: 'BRL',
    image: data.image || 'assets/showcase/smart-tvs.png',
    location: data.location || seller.location,
    externalUrl: null,
    externalId: `SEL-LST-${Date.now()}`,
    status: 'active',
    views: 0,
    createdAt: new Date().toISOString(),
  };

  listings.push(listing);
  await store.saveListings(listings);
  return listing;
}

export async function linkIdentity(userId, { marketplaceId, externalId, externalEmail, externalPhone }) {
  const identities = await store.getUserIdentities();
  const entry = {
    id: `id-${Date.now()}`,
    userId,
    marketplaceId,
    externalId,
    externalEmail: normalizeEmail(externalEmail),
    externalPhone: normalizePhone(externalPhone),
    linkedAt: new Date().toISOString(),
    verified: false,
  };

  identities.push(entry);
  await store.saveUserIdentities(identities);
  await crossReferenceUser(userId);
  return entry;
}

export async function crossReferenceUser(userId, newSeller = null) {
  const [users, sellers, identities, transactions] = await Promise.all([
    store.getUsers(),
    store.getSellers(),
    store.getUserIdentities(),
    store.getHubTransactions(),
  ]);

  const user = users.find(u => u.id === userId);
  if (!user) return { matches: [] };

  const userEmail = normalizeEmail(user.email);
  const userPhone = normalizePhone(user.phone);
  const matches = [];

  sellers.forEach(seller => {
    if (seller.userId === userId) return;
    const emailMatch = userEmail && normalizeEmail(seller.email) === userEmail;
    const phoneMatch = userPhone && normalizePhone(seller.phone) === userPhone;
    if (emailMatch || phoneMatch) {
      matches.push({
        type: emailMatch ? 'email' : 'phone',
        sellerId: seller.id,
        sellerName: seller.name,
        marketplaceId: seller.marketplaceId,
        confidence: emailMatch && phoneMatch ? 'high' : 'medium',
      });
    }
  });

  identities.forEach(id => {
    if (id.userId === userId) return;
    const emailMatch = userEmail && id.externalEmail === userEmail;
    const phoneMatch = userPhone && id.externalPhone === userPhone;
    if (emailMatch || phoneMatch) {
      matches.push({
        type: 'identity',
        userId: id.userId,
        marketplaceId: id.marketplaceId,
        confidence: 'high',
      });
    }
  });

  const relatedTransactions = transactions.filter(t =>
    t.buyerId === userId || t.sellerId === userId ||
    (newSeller && t.sellerId === newSeller.id)
  );

  return {
    userId,
    matches: [...new Map(matches.map(m => [JSON.stringify(m), m])).values()],
    transactionCount: relatedTransactions.length,
    totalVolume: relatedTransactions.reduce((s, t) => s + (t.grossAmount || 0), 0),
  };
}

export async function recordTransaction(data) {
  const transactions = await store.getHubTransactions();
  const tx = {
    id: `tx-${Date.now()}`,
    listingId: data.listingId,
    buyerId: data.buyerId || null,
    sellerId: data.sellerId,
    marketplaceId: data.marketplaceId,
    grossAmount: Number(data.grossAmount),
    platformFee: Number(data.platformFee || 0),
    netAmount: Number(data.netAmount || data.grossAmount),
    status: data.status || 'pending',
    type: data.type || 'sale',
    metadata: data.metadata || {},
    createdAt: new Date().toISOString(),
    completedAt: data.status === 'completed' ? new Date().toISOString() : null,
  };

  transactions.push(tx);
  await store.saveHubTransactions(transactions);

  if (data.buyerId) await crossReferenceUser(data.buyerId);
  if (data.sellerId) {
    const sellers = await store.getSellers();
    const seller = sellers.find(s => s.id === data.sellerId);
    if (seller?.userId) await crossReferenceUser(seller.userId);
  }

  return tx;
}

export async function getAnalytics(userId = null) {
  const [transactions, listings, marketplaces] = await Promise.all([
    store.getHubTransactions(),
    store.getAllListingsRaw?.() || store.getListings(),
    store.getMarketplaces(),
  ]);

  let filtered = transactions;
  if (userId) {
    const sellers = await store.getSellers();
    const userSellerIds = sellers.filter(s => s.userId === userId).map(s => s.id);
    filtered = transactions.filter(t =>
      t.buyerId === userId || userSellerIds.includes(t.sellerId)
    );
  }

  const byMarketplace = {};
  const byCondition = {};
  let totalGross = 0;
  let totalFees = 0;
  let totalNet = 0;

  filtered.forEach(tx => {
    totalGross += tx.grossAmount || 0;
    totalFees += tx.platformFee || 0;
    totalNet += tx.netAmount || 0;
    byMarketplace[tx.marketplaceId] = (byMarketplace[tx.marketplaceId] || 0) + (tx.grossAmount || 0);
  });

  listings.forEach(lst => {
    byCondition[lst.condition] = (byCondition[lst.condition] || 0) + 1;
  });

  return {
    summary: {
      transactionCount: filtered.length,
      totalGross,
      totalFees,
      totalNet,
      activeListings: listings.filter(l => l.status === 'active').length,
    },
    byMarketplace: Object.entries(byMarketplace).map(([id, volume]) => ({
      marketplace: marketplaces.find(m => m.id === id) || { id, name: id },
      volume,
    })),
    byCondition,
  };
}

export async function getUserHubProfile(userId) {
  const [sellers, identities, crossRef] = await Promise.all([
    store.getSellers(),
    store.getUserIdentities(),
    crossReferenceUser(userId),
  ]);

  const seller = sellers.find(s => s.userId === userId);
  const userIdentities = identities.filter(i => i.userId === userId);
  const analytics = await getAnalytics(userId);

  return {
    seller,
    identities: userIdentities,
    crossReference: crossRef,
    analytics,
  };
}
