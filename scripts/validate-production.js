#!/usr/bin/env node
/**
 * Valida API em produção + Mercado Pago + PostgreSQL
 * Uso: node scripts/validate-production.js [URL]
 */
const BASE = process.argv[2] || process.env.PRODUCTION_URL || 'http://localhost:4000';

const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, ok: true, ...result });
    console.log(`✅ ${name}`);
    if (result.detail) console.log(`   ${result.detail}`);
  } catch (err) {
    checks.push({ name, ok: false, error: err.message });
    console.log(`❌ ${name}: ${err.message}`);
  }
}

await check('Health API', async () => {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { detail: `v${data.version} | ${data.deploy} | ${data.url}` };
});

await check('Produtos (16+)', async () => {
  const res = await fetch(`${BASE}/api/products`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 16) throw new Error(`Apenas ${data?.length || 0} produtos`);
  return { detail: `${data.length} produtos` };
});

await check('Categorias (12)', async () => {
  const res = await fetch(`${BASE}/api/categories`);
  const data = await res.json();
  if (data.length < 12) throw new Error(`Apenas ${data.length} categorias`);
  return { detail: `${data.length} categorias` };
});

await check('Carousel', async () => {
  const res = await fetch(`${BASE}/api/carousel`);
  const data = await res.json();
  if (!data.length) throw new Error('Carousel vazio');
  return { detail: `${data.length} slides` };
});

await check('PostgreSQL', async () => {
  const res = await fetch(`${BASE}/api/health`);
  const data = await res.json();
  if (!data.database?.connected) throw new Error(data.database?.message || 'Não conectado');
  return { detail: data.database.message };
});

await check('Mercado Pago', async () => {
  const res = await fetch(`${BASE}/api/payments/config`);
  const data = await res.json();
  if (!data.configured) throw new Error(data.message || 'Não configurado');
  return { detail: `Modo: ${data.mode}` };
});

const failed = checks.filter(c => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} verificações OK`);
process.exit(failed > 0 ? 1 : 0);
