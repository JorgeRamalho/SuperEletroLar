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
    description: description || `Pedido SuperEletroLar ${orderId.slice(0, 8)}`,
    payment_method_id: 'pix',
    payer: { email: email || 'comprador@supereletrolar.com.br' },
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

export async function createPreference({ items, orderId, payerEmail }) {
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
