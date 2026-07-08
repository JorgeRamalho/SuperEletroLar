import { store } from '../utils/store.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

function mergeRule(base, override) {
  if (!override) return { ...base };
  return {
    percent: override.percent ?? base.percent,
    fixed: override.fixed ?? base.fixed,
    minFee: override.minFee ?? base.minFee,
    label: override.label || base.label,
  };
}

export async function getFeeRules() {
  return store.getFeeRules();
}

export async function calculateCommission(input) {
  const rules = await getFeeRules();
  const grossAmount = round2(Number(input.amount || input.grossAmount || 0));
  if (grossAmount <= 0) {
    throw new Error('Valor inválido para cálculo de comissão');
  }

  const listingType = input.listingType || 'product';
  const condition = input.condition || 'used';
  const category = input.category || 'geral';
  const sellerPlan = input.sellerPlan || 'free';

  let rule = { ...rules.default, label: rules.default.label || 'Comissão Trampolim' };
  const applied = ['default'];

  if (rules.byListingType?.[listingType]) {
    rule = mergeRule(rule, rules.byListingType[listingType]);
    applied.push(`listingType:${listingType}`);
  }
  if (rules.byCondition?.[condition]) {
    rule = mergeRule(rule, rules.byCondition[condition]);
    applied.push(`condition:${condition}`);
  }
  if (rules.byCategory?.[category]) {
    rule = mergeRule(rule, rules.byCategory[category]);
    applied.push(`category:${category}`);
  }

  const planDiscount = rules.sellerPlans?.[sellerPlan]?.percentDiscount || 0;
  const effectivePercent = Math.max(0, rule.percent - planDiscount);

  let platformFee = round2(grossAmount * (effectivePercent / 100) + (rule.fixed || 0));
  if (rule.minFee && platformFee < rule.minFee) {
    platformFee = rule.minFee;
  }

  const proc = rules.paymentProcessing || {};
  let processingFee = 0;
  if (proc.percent || proc.fixed) {
    processingFee = round2(grossAmount * ((proc.percent || 0) / 100) + (proc.fixed || 0));
  }

  let netAmount = grossAmount - platformFee;
  if (proc.absorbedBy === 'seller') {
    netAmount = round2(netAmount - processingFee);
  }

  const buyerTotal = proc.absorbedBy === 'buyer'
    ? round2(grossAmount + processingFee)
    : grossAmount;

  return {
    grossAmount,
    platformFee,
    processingFee,
    netAmount: round2(Math.max(0, netAmount)),
    buyerTotal,
    effectivePercent,
    planDiscount,
    rulesApplied: applied,
    breakdown: {
      platform: {
        label: rule.label,
        percent: effectivePercent,
        fixed: rule.fixed || 0,
        amount: platformFee,
      },
      processing: {
        label: proc.label || 'Taxa de pagamento',
        percent: proc.percent || 0,
        fixed: proc.fixed || 0,
        amount: processingFee,
        absorbedBy: proc.absorbedBy || 'seller',
      },
      sellerReceives: round2(Math.max(0, netAmount)),
      trampolimReceives: platformFee,
    },
  };
}

export async function previewListingFees(listingId, amountOverride) {
  const { getListingById } = await import('./marketplace-hub.js');
  const listing = await getListingById(listingId);
  if (!listing) throw new Error('Anúncio não encontrado');

  const amount = amountOverride != null ? Number(amountOverride) : listing.price;
  const fees = await calculateCommission({
    amount,
    listingType: listing.listingType,
    condition: listing.condition,
    category: listing.category,
    sellerPlan: listing.seller?.plan || 'free',
  });

  return { listing: { id: listing.id, title: listing.title, price: listing.price }, fees };
}
