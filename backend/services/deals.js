import { v4 as uuidv4 } from 'uuid';
import { store } from '../utils/store.js';
import { calculateCommission, previewListingFees } from './commission.js';
import { getListingById, recordTransaction } from './marketplace-hub.js';
import {
  isMercadoPagoConfigured,
  createMarketplacePix,
  createMarketplacePreference,
} from './mercadopago.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

export { previewListingFees, calculateCommission };

export async function getDeals() {
  return store.getHubDeals();
}

export async function findDealById(id) {
  const deals = await getDeals();
  return deals.find(d => d.id === id) || null;
}

export async function createDeal(buyerId, { listingId, amount, notes }) {
  const listing = await getListingById(listingId);
  if (!listing) throw new Error('Anúncio não encontrado');
  if (listing.isRetail) throw new Error('Use o carrinho da loja para produtos novos oficiais');

  const grossAmount = round2(amount != null ? Number(amount) : listing.price);
  const fees = await calculateCommission({
    amount: grossAmount,
    listingType: listing.listingType,
    condition: listing.condition,
    category: listing.category,
    sellerPlan: listing.seller?.plan || 'free',
  });

  const sellers = await store.getSellers();
  const seller = sellers.find(s => s.id === listing.sellerId);

  const deal = {
    id: `deal-${uuidv4().slice(0, 8)}`,
    listingId: listing.id,
    listingTitle: listing.title,
    listingType: listing.listingType,
    buyerId,
    sellerId: listing.sellerId,
    sellerUserId: seller?.userId || null,
    sellerMpCollectorId: seller?.mpCollectorId || null,
    marketplaceId: listing.marketplaceId,
    grossAmount: fees.grossAmount,
    platformFee: fees.platformFee,
    processingFee: fees.processingFee,
    netAmount: fees.netAmount,
    buyerTotal: fees.buyerTotal,
    feeBreakdown: fees.breakdown,
    rulesApplied: fees.rulesApplied,
    status: 'pending_payment',
    paymentMethod: null,
    paymentId: null,
    mpExternalId: null,
    transactionId: null,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    paidAt: null,
    completedAt: null,
  };

  const deals = await getDeals();
  deals.push(deal);
  await store.saveHubDeals(deals);

  const tx = await recordTransaction({
    listingId: listing.id,
    buyerId,
    sellerId: listing.sellerId,
    marketplaceId: listing.marketplaceId,
    grossAmount: fees.grossAmount,
    platformFee: fees.platformFee,
    netAmount: fees.netAmount,
    status: 'pending',
    type: 'deal',
    metadata: { dealId: deal.id },
  });

  deal.transactionId = tx.id;
  await updateDeal(deal);

  return deal;
}

export async function updateDeal(deal) {
  const deals = await getDeals();
  const idx = deals.findIndex(d => d.id === deal.id);
  if (idx >= 0) deals[idx] = deal;
  else deals.push(deal);
  await store.saveHubDeals(deals);
  return deal;
}

export async function payDeal(dealId, buyerId, { method, email }) {
  const deal = await findDealById(dealId);
  if (!deal) throw new Error('Negociação não encontrada');
  if (deal.buyerId && deal.buyerId !== buyerId) {
    throw new Error('Esta negociação pertence a outro comprador');
  }
  if (deal.status === 'paid' || deal.status === 'completed') {
    throw new Error('Negociação já paga');
  }

  const payMethod = method || 'pix';
  const amount = deal.buyerTotal || deal.grossAmount;
  let paymentResult;

  if (isMercadoPagoConfigured()) {
    if (payMethod === 'checkout') {
      paymentResult = await createMarketplacePreference({
        orderId: deal.id,
        payerEmail: email,
        items: [{ name: deal.listingTitle, qty: 1, price: amount }],
        marketplaceFee: deal.platformFee,
        sellerCollectorId: deal.sellerMpCollectorId,
      });
      deal.paymentMethod = 'mercadopago_checkout';
      deal.checkoutUrl = paymentResult.checkoutUrl;
      deal.sandboxUrl = paymentResult.sandboxUrl;
      deal.preferenceId = paymentResult.preferenceId;
    } else {
      paymentResult = await createMarketplacePix({
        orderId: deal.id,
        amount,
        email,
        description: `Trampolim — ${deal.listingTitle}`,
        applicationFee: deal.platformFee,
        sellerCollectorId: deal.sellerMpCollectorId,
      });
      deal.paymentMethod = 'pix';
      deal.mpExternalId = paymentResult.externalId;
      deal.pixCode = paymentResult.pixCode;
      deal.pixQrCode = paymentResult.pixQrCode;
      deal.mpMode = paymentResult.mode;
    }
  } else {
    const simulatedPix = `00020126580014BR.GOV.BCB.PIX0136TRAMPOLIM520400005303986540${amount.toFixed(2)}5802BR5913Trampolim6009SAO PAULO62070503***6304${deal.id.slice(-4).toUpperCase()}`;
    paymentResult = {
      externalId: `sim-${deal.id}`,
      pixCode: simulatedPix,
      pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(simulatedPix)}`,
      mode: 'simulated',
    };
    deal.paymentMethod = 'pix_simulated';
    deal.mpExternalId = paymentResult.externalId;
    deal.pixCode = paymentResult.pixCode;
    deal.pixQrCode = paymentResult.pixQrCode;
    deal.mpMode = 'simulated';
  }

  deal.status = 'awaiting_payment';
  deal.paymentId = paymentResult.externalId || deal.preferenceId;
  await updateDeal(deal);

  return {
    deal,
    payment: {
      method: deal.paymentMethod,
      amount,
      platformFee: deal.platformFee,
      netToSeller: deal.netAmount,
      pixCode: deal.pixCode,
      pixQrCode: deal.pixQrCode,
      checkoutUrl: deal.checkoutUrl,
      sandboxUrl: deal.sandboxUrl,
      mode: deal.mpMode || (isMercadoPagoConfigured() ? 'mercadopago' : 'simulated'),
    },
  };
}

export async function confirmDealPayment(dealId, buyerId) {
  const deal = await findDealById(dealId);
  if (!deal) throw new Error('Negociação não encontrada');
  if (deal.buyerId !== buyerId) throw new Error('Acesso negado');

  if (deal.mpMode === 'simulated' || !isMercadoPagoConfigured()) {
    return completeDeal(dealId, 'pix_simulated');
  }

  throw new Error('Aguardando confirmação automática do Mercado Pago');
}

export async function completeDeal(dealId, paymentMethod = 'mercadopago') {
  const deal = await findDealById(dealId);
  if (!deal) throw new Error('Negociação não encontrada');
  if (deal.status === 'completed') return deal;

  deal.status = 'completed';
  deal.paymentMethod = deal.paymentMethod || paymentMethod;
  deal.paidAt = deal.paidAt || new Date().toISOString();
  deal.completedAt = new Date().toISOString();
  deal.trackingCode = deal.trackingCode || `TRP${Date.now().toString(36).toUpperCase()}`;

  await updateDeal(deal);

  const transactions = await store.getHubTransactions();
  const tx = transactions.find(t => t.id === deal.transactionId);
  if (tx) {
    tx.status = 'completed';
    tx.completedAt = deal.completedAt;
    tx.metadata = { ...tx.metadata, trackingCode: deal.trackingCode };
    await store.saveHubTransactions(transactions);
  }

  const sellers = await store.getSellers();
  const seller = sellers.find(s => s.id === deal.sellerId);
  if (seller) {
    seller.salesCount = (seller.salesCount || 0) + 1;
    await store.saveSellers(sellers);
  }

  return deal;
}

export async function getDealsByUser(userId) {
  const deals = await getDeals();
  const sellers = await store.getSellers();
  const sellerIds = sellers.filter(s => s.userId === userId).map(s => s.id);
  return deals.filter(d => d.buyerId === userId || sellerIds.includes(d.sellerId));
}

export async function handleDealWebhook(externalReference, mpStatus) {
  if (!externalReference?.startsWith('deal-')) return null;
  if (mpStatus !== 'approved') return null;
  return completeDeal(externalReference, 'mercadopago');
}
