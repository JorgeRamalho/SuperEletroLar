#!/usr/bin/env node
/**
 * Valida API em produção + banco (Postgres/Neon/SQLite) + Mercado Pago
 * Uso: node scripts/validate-production.js [URL]
 */
const BASE = (process.argv[2] || process.env.PRODUCTION_URL || 'http://localhost:4000').replace(/\/$/, '');

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
  return {
    detail: `v${data.version} | storage=${data.storage || data.database?.mode || '?'} | ${data.url || BASE}`,
  };
});

await check('Banco de dados', async () => {
  const res = await fetch(`${BASE}/api/health`);
  const data = await res.json();
  if (!data.database?.connected) {
    throw new Error(data.database?.message || 'Banco não conectado');
  }
  const mode = data.database.mode || data.storage || 'unknown';
  if (mode === 'json') {
    throw new Error('Produção ainda em JSON — configure DATABASE_URL (Render ou Neon)');
  }
  return {
    detail: `${mode} · ${data.database.message}${data.database.users != null ? ` · users=${data.database.users}` : ''}`,
  };
});

await check('Produtos', async () => {
  const res = await fetch(`${BASE}/api/products`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 1) throw new Error(`Apenas ${data?.length || 0} produtos`);
  return { detail: `${data.length} produtos` };
});

await check('Categorias', async () => {
  const res = await fetch(`${BASE}/api/categories`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 1) throw new Error(`Apenas ${data?.length || 0} categorias`);
  return { detail: `${data.length} categorias` };
});

await check('Carousel', async () => {
  const res = await fetch(`${BASE}/api/carousel`);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error('Carousel vazio');
  return { detail: `${data.length} slides` };
});

await check('Auth register endpoint', async () => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  // Esperado: 400 (validação), não 404/500 de rota inexistente
  if (res.status === 404) throw new Error('Rota /api/auth/register não encontrada');
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  return { detail: `rota ativa (HTTP ${res.status})` };
});

await check('Mercado Pago', async () => {
  const res = await fetch(`${BASE}/api/payments/config`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.configured) {
    return { detail: `Não configurado ainda — ${data.message || 'defina MERCADOPAGO_* no Render'}` };
  }
  return { detail: `Modo: ${data.mode}` };
});

const failed = checks.filter(c => !c.ok).length;
const soft = checks.filter(c => c.ok && String(c.detail || '').includes('Não configurado'));
console.log(`\n${checks.length - failed}/${checks.length} verificações OK`);
if (soft.length) {
  console.log(`ℹ️  ${soft.length} item(ns) opcional(is) pendente(s) (Mercado Pago).`);
}
if (failed > 0) {
  console.log('\nPróximos passos:');
  console.log('  1. npm run deploy:render');
  console.log('  2. No Neon: copie DATABASE_URL com sslmode=require');
  console.log('  3. No Render → Environment → cole DATABASE_URL / MERCADOPAGO_*');
  console.log('  4. npm run deploy:validate -- https://SEU-APP.onrender.com');
}
process.exit(failed > 0 ? 1 : 0);
