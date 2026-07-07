import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store, isUsingPostgres } from '../utils/store.js';
import {
  isMercadoPagoConfigured,
  validateMercadoPago,
  createPixPayment as mpCreatePix,
  createPreference,
  getPaymentStatus,
} from '../services/mercadopago.js';

const router = Router();

function generatePixCode(orderId, amount) {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `00020126580014BR.GOV.BCB.PIX0136${random}520400005303986540${amount.toFixed(2)}5802BR5913SuperEletroLar6009SAO PAULO62070503***6304${orderId.slice(0, 4).toUpperCase()}`;
}

async function approveOrder(orderId, paymentMethod) {
  let order;
  if (isUsingPostgres()) {
    order = await store.findOrderById(orderId);
    if (!order || order.status === 'paid') return order;
    order.status = 'paid';
    if (paymentMethod) order.payment = paymentMethod;
    order.trackingCode = order.trackingCode || `SEL${Date.now().toString(36).toUpperCase()}`;
    await store.updateOrder(order);
  } else {
    const orders = await store.getOrders();
    order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'paid') return order;
    order.status = 'paid';
    if (paymentMethod) order.payment = paymentMethod;
    order.trackingCode = order.trackingCode || `SEL${Date.now().toString(36).toUpperCase()}`;
    await store.saveOrders(orders);
  }
  await store.decrementStock(order.items);
  return order;
}

async function savePayment(payment) {
  if (isUsingPostgres()) return store.insertPayment(payment);
  const payments = await store.getPayments();
  payments.push(payment);
  await store.savePayments(payments);
  return payment;
}

async function updatePaymentRecord(payment) {
  if (isUsingPostgres()) return store.updatePayment(payment);
  const payments = await store.getPayments();
  const idx = payments.findIndex(p => p.id === payment.id);
  if (idx >= 0) payments[idx] = { ...payments[idx], ...payment };
  await store.savePayments(payments);
  return payment;
}

async function findPayment(id) {
  if (isUsingPostgres()) return store.findPaymentById(id);
  const payments = await store.getPayments();
  return payments.find(p => p.id === id);
}

router.get('/config', async (_req, res) => {
  const mp = await validateMercadoPago();
  res.json({
    configured: mp.configured,
    mode: mp.mode,
    message: mp.message || (mp.configured ? 'Mercado Pago ativo' : 'Modo simulado'),
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || null,
  });
});

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment' && data?.id) {
      const mpPayment = await getPaymentStatus(data.id);
      if (mpPayment.status === 'approved' && mpPayment.external_reference) {
        let payment;
        if (isUsingPostgres()) {
          payment = await store.findPaymentByExternalId(String(data.id));
        } else {
          const payments = await store.getPayments();
          payment = payments.find(p => p.externalId === String(data.id));
        }
        if (payment) {
          payment.status = 'approved';
          payment.approvedAt = new Date().toISOString();
          await updatePaymentRecord(payment);
        }
        await approveOrder(mpPayment.external_reference, 'mercadopago');
      }
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
});

router.post('/pix', async (req, res) => {
  try {
    const { orderId, amount, email } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'orderId e amount são obrigatórios' });
    }

    let payment;

    if (isMercadoPagoConfigured()) {
      const mp = await mpCreatePix({ amount: Number(amount), email, orderId });
      payment = {
        id: uuidv4(),
        orderId,
        method: 'pix',
        amount: Number(amount),
        status: mp.status === 'approved' ? 'approved' : 'pending',
        externalId: mp.externalId,
        pixCode: mp.pixCode,
        pixQrCode: mp.pixQrCode,
        expiresAt: mp.expiresAt,
        createdAt: new Date().toISOString(),
      };
    } else {
      const pixCode = generatePixCode(orderId, Number(amount));
      payment = {
        id: uuidv4(),
        orderId,
        method: 'pix',
        amount: Number(amount),
        status: 'pending',
        pixCode,
        pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
    }

    await savePayment(payment);
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/pix/confirm', async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await findPayment(paymentId);
    if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });

    if (payment.externalId && isMercadoPagoConfigured()) {
      const mp = await getPaymentStatus(payment.externalId);
      if (mp.status !== 'approved') {
        return res.status(400).json({ error: 'Pagamento ainda não confirmado pelo Mercado Pago' });
      }
    }

    payment.status = 'approved';
    payment.approvedAt = new Date().toISOString();
    await updatePaymentRecord(payment);

    const approved = await approveOrder(payment.orderId, 'pix');
    res.json({ status: 'approved', order: approved, trackingCode: approved?.trackingCode });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/card', async (req, res) => {
  try {
    const { orderId, amount, cardNumber, cardName, expiry, cvv, installments } = req.body;

    if (!orderId || !amount || !cardNumber || !cardName || !expiry || !cvv) {
      return res.status(400).json({ error: 'Dados do cartão incompletos' });
    }

    const lastFour = cardNumber.replace(/\s/g, '').slice(-4);
    const isApproved = !cardNumber.replace(/\s/g, '').startsWith('0000');

    const payment = {
      id: uuidv4(),
      orderId,
      method: 'credit_card',
      amount: Number(amount),
      installments: Number(installments) || 1,
      status: isApproved ? 'approved' : 'rejected',
      cardLastFour: lastFour,
      createdAt: new Date().toISOString(),
    };

    await savePayment(payment);

    if (isApproved) {
      const approved = await approveOrder(orderId, 'credit_card');
      return res.json({ status: 'approved', payment, trackingCode: approved?.trackingCode });
    }

    res.status(400).json({ status: 'rejected', error: 'Cartão recusado. Verifique os dados ou tente outro cartão.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/mercadopago', async (req, res) => {
  try {
    const { orderId, amount, email } = req.body;

    if (isMercadoPagoConfigured()) {
      let order;
      if (isUsingPostgres()) {
        order = await store.findOrderById(orderId);
      } else {
        const orders = await store.getOrders();
        order = orders.find(o => o.id === orderId);
      }

      const pref = await createPreference({
        items: order?.items || [{ name: 'Pedido SuperEletroLar', qty: 1, price: Number(amount) }],
        orderId,
        payerEmail: email || order?.customer?.email,
      });

      const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-');
      const payment = {
        id: uuidv4(),
        orderId,
        method: 'mercadopago',
        amount: Number(amount),
        status: 'pending',
        preferenceId: pref.preferenceId,
        checkoutUrl: isTest ? pref.sandboxUrl : pref.checkoutUrl,
        createdAt: new Date().toISOString(),
      };

      await savePayment(payment);
      return res.json(payment);
    }

    const payment = {
      id: uuidv4(),
      orderId,
      method: 'mercadopago',
      amount: Number(amount),
      status: 'sandbox_approved',
      sandbox: true,
      message: 'Modo sandbox: configure MERCADOPAGO_ACCESS_TOKEN para produção.',
      checkoutUrl: `#sandbox-checkout/${orderId}`,
      createdAt: new Date().toISOString(),
    };

    await savePayment(payment);
    const approved = await approveOrder(orderId, 'mercadopago');
    return res.json({ ...payment, trackingCode: approved?.trackingCode });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/status', async (req, res) => {
  const payment = await findPayment(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });

  if (payment.externalId && isMercadoPagoConfigured()) {
    try {
      const mp = await getPaymentStatus(payment.externalId);
      payment.mpStatus = mp.status;
    } catch { /* ignore */ }
  }

  res.json(payment);
});

export default router;
