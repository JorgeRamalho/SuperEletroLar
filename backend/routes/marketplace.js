import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import {
  searchHub,
  getListingById,
  registerSeller,
  createListing,
  linkIdentity,
  crossReferenceUser,
  recordTransaction,
  getAnalytics,
  getUserHubProfile,
  getAllListings,
} from '../services/marketplace-hub.js';
import {
  previewListingFees,
  calculateCommission,
  createDeal,
  payDeal,
  confirmDealPayment,
  findDealById,
  getDealsByUser,
} from '../services/deals.js';
import { getFeeRules } from '../services/commission.js';
import { store } from '../utils/store.js';

const router = Router();

router.get('/fee-rules', async (_req, res) => {
  try {
    res.json(await getFeeRules());
  } catch {
    res.status(500).json({ error: 'Erro ao carregar regras de comissão' });
  }
});

router.get('/fee-preview', async (req, res) => {
  try {
    const { listingId, amount } = req.query;
    if (!listingId) return res.status(400).json({ error: 'listingId é obrigatório' });
    const preview = await previewListingFees(listingId, amount);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro no preview de taxas' });
  }
});

router.post('/fee-calculate', async (req, res) => {
  try {
    const fees = await calculateCommission(req.body);
    res.json(fees);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/deals', authMiddleware, async (req, res) => {
  try {
    const deal = await createDeal(req.user.id, req.body);
    res.status(201).json(deal);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao criar negociação' });
  }
});

router.get('/deals/mine', authMiddleware, async (req, res) => {
  try {
    const deals = await getDealsByUser(req.user.id);
    res.json(deals);
  } catch {
    res.status(500).json({ error: 'Erro ao listar negociações' });
  }
});

router.get('/deals/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await findDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Negociação não encontrada' });
    if (deal.buyerId !== req.user.id) {
      const sellers = await store.getSellers();
      const sellerIds = sellers.filter(s => s.userId === req.user.id).map(s => s.id);
      if (!sellerIds.includes(deal.sellerId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
    res.json(deal);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar negociação' });
  }
});

router.post('/deals/:id/pay', authMiddleware, async (req, res) => {
  try {
    const result = await payDeal(req.params.id, req.user.id, {
      method: req.body.method || 'pix',
      email: req.body.email || req.user.email,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao iniciar pagamento' });
  }
});

router.post('/deals/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const deal = await confirmDealPayment(req.params.id, req.user.id);
    res.json(deal);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao confirmar pagamento' });
  }
});

router.get('/platforms', async (_req, res) => {
  try {
    const platforms = await store.getMarketplaces();
    res.json(platforms);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar plataformas' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const result = await searchHub(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro na busca' });
  }
});

router.get('/listings', async (_req, res) => {
  try {
    const items = await getAllListings();
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Erro ao listar anúncios' });
  }
});

router.get('/listings/:id', async (req, res) => {
  try {
    const listing = await getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });
    res.json(listing);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar anúncio' });
  }
});

router.post('/listings', authMiddleware, async (req, res) => {
  try {
    const listing = await createListing(req.user.id, req.body);
    res.status(201).json(listing);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao criar anúncio' });
  }
});

router.post('/sellers/register', authMiddleware, async (req, res) => {
  try {
    const result = await registerSeller(req.user.id, {
      ...req.body,
      email: req.body.email || req.user.email,
    });
    res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao cadastrar vendedor' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await getUserHubProfile(req.user.id);
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar perfil hub' });
  }
});

router.post('/identities/link', authMiddleware, async (req, res) => {
  try {
    const { marketplaceId, externalId, externalEmail, externalPhone } = req.body;
    if (!marketplaceId) {
      return res.status(400).json({ error: 'marketplaceId é obrigatório' });
    }
    const identity = await linkIdentity(req.user.id, {
      marketplaceId,
      externalId,
      externalEmail,
      externalPhone,
    });
    res.status(201).json(identity);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao vincular conta' });
  }
});

router.get('/cross-reference/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const result = await crossReferenceUser(userId);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Erro no cruzamento de dados' });
  }
});

router.post('/transactions', optionalAuth, async (req, res) => {
  try {
    const tx = await recordTransaction({
      ...req.body,
      buyerId: req.body.buyerId || req.user?.id || null,
    });
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao registrar transação' });
  }
});

router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const analytics = await getAnalytics(req.user.id);
    res.json(analytics);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar analytics' });
  }
});

router.get('/analytics/global', async (_req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar analytics global' });
  }
});

export default router;
