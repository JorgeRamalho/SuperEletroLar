const MP_API = 'https://api.mercadopago.com';

export function isMercadoPagoConfigured() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  return Boolean(token && !token.includes('your-access-token') && !token.includes('TEST-your'));
}

export async function validateMercadoPago() {
  if (!isMercadoPagoConfigured()) {
    return { configured: false, mode: 'sandbox', message: 'Token não configurado' };
  }

  try {
    const res = await fetch(`${MP_API}/users/me`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { configured: false, mode: 'error', message: data.message || `HTTP ${res.status}` };
    }

    const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-');
    return {
      configured: true,
      mode: isTest ? 'sandbox' : 'production',
      userId: data.id,
      email: data.email,
      country: data.country_id,
    };
  } catch (err) {
    return { configured: false, mode: 'error', message: err.message };
  }
}

export async function createPixPayment({ amount, email, orderId, description }) {
  const body = {
    transaction_amount: Number(amount),
    description: description || `Pedido Trampolim ${orderId.slice(0, 8)}`,
    payment_method_id: 'pix',
    payer: { email: email || 'comprador@trampolim.com.br' },
    external_reference: orderId,
    notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
  };

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${orderId}-pix-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Erro ao criar pagamento Pix');
  }

  const tx = data.point_of_interaction?.transaction_data;
  return {
    externalId: String(data.id),
    status: data.status,
    pixCode: tx?.qr_code || '',
    pixQrCode: tx?.qr_code_base64
      ? `data:image/png;base64,${tx.qr_code_base64}`
      : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tx?.qr_code || '')}`,
    expiresAt: data.date_of_expiration,
  };
}

export async function getPaymentStatus(externalId) {
  const res = await fetch(`${MP_API}/v1/payments/${externalId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Pagamento não encontrado');
  return data;
}

export async function createPreference({ items, orderId, payerEmail, marketplaceFee, sellerCollectorId }) {
  if (marketplaceFee || sellerCollectorId) {
    return createMarketplacePreference({ items, orderId, payerEmail, marketplaceFee, sellerCollectorId });
  }
  return createPreferenceLegacy({ items, orderId, payerEmail });
}

/** Pagamento Pix com comissão da plataforma (marketplace split) */
export async function createMarketplacePix({
  amount,
  email,
  orderId,
  description,
  applicationFee = 0,
  sellerCollectorId,
}) {
  const body = {
    transaction_amount: Number(amount),
    description: description || `Trampolim ${orderId.slice(0, 8)}`,
    payment_method_id: 'pix',
    payer: { email: email || 'comprador@trampolim.com.br' },
    external_reference: orderId,
    notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
  };

  if (applicationFee > 0) {
    body.application_fee = round2(Number(applicationFee));
  }

  if (sellerCollectorId) {
    body.collector_id = sellerCollectorId;
  }

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${orderId}-mpix-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Erro ao criar Pix marketplace');
  }

  const tx = data.point_of_interaction?.transaction_data;
  const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');

  return {
    externalId: String(data.id),
    status: data.status,
    pixCode: tx?.qr_code || '',
    pixQrCode: tx?.qr_code_base64
      ? `data:image/png;base64,${tx.qr_code_base64}`
      : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tx?.qr_code || '')}`,
    mode: isTest ? 'sandbox' : 'production',
    applicationFee: body.application_fee || 0,
  };
}

/** Checkout Pro com taxa de marketplace */
export async function createMarketplacePreference({
  items,
  orderId,
  payerEmail,
  marketplaceFee = 0,
  sellerCollectorId,
}) {
  const payload = {
    items: items.map(i => ({
      title: i.name,
      quantity: i.qty,
      unit_price: Number(i.price),
      currency_id: 'BRL',
    })),
    payer: { email: payerEmail },
    external_reference: orderId,
    back_urls: {
      success: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'}/?view=hub-deals&deal=${orderId}`,
      failure: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'}/?view=hub-listing`,
      pending: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'}/?view=hub-deals&deal=${orderId}`,
    },
    auto_return: 'approved',
    notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
  };

  if (marketplaceFee > 0) {
    payload.marketplace_fee = round2(Number(marketplaceFee));
  }

  if (sellerCollectorId) {
    payload.collector_id = sellerCollectorId;
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao criar checkout marketplace');

  const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');
  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point,
    sandboxUrl: data.sandbox_init_point,
    mode: isTest ? 'sandbox' : 'production',
    marketplaceFee: payload.marketplace_fee || 0,
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export async function createPreferenceLegacy({ items, orderId, payerEmail }) {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: items.map(i => ({
        title: i.name,
        quantity: i.qty,
        unit_price: i.price,
        currency_id: 'BRL',
      })),
      payer: { email: payerEmail },
      external_reference: orderId,
      back_urls: {
        success: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'}/?view=orders`,
        failure: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'}/?view=cart`,
        pending: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000'}/?view=orders`,
      },
      auto_return: 'approved',
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao criar checkout Mercado Pago');
  return {
    preferenceId: data.id,
    checkoutUrl: data.init_point,
    sandboxUrl: data.sandbox_init_point,
  };
}
