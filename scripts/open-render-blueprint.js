/**
 * Abre os painéis necessários para configurar produção (Render + Neon).
 * Uso: node scripts/open-render-blueprint.js
 */
import { execSync } from 'child_process';

const REPO = 'https://github.com/JorgeRamalho/Trampolim';
const BLUEPRINT_URL = 'https://dashboard.render.com/blueprint/new';
const NEON_URL = 'https://console.neon.tech/app/projects';
const RENDER_ENV_DOCS = 'https://dashboard.render.com/';

function openUrl(url) {
  try {
    const cmd = process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    console.log('Abra manualmente:', url);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('  Trampolim — Configuração de produção');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('Repositório:', REPO);
console.log('');
console.log('PASSO 1 — Neon (banco PostgreSQL)');
console.log('  1. Login em https://console.neon.tech');
console.log('  2. Create project → nome: trampolim');
console.log('  3. Connection Details → copie a connection string');
console.log('     (deve terminar com ?sslmode=require)');
console.log('');
console.log('PASSO 2 — Render (app + deploy)');
console.log('  1. Login com GitHub em https://dashboard.render.com');
console.log('  2. New → Blueprint → selecione JorgeRamalho/Trampolim');
console.log('  3. Branch: main → Apply / Deploy Blueprint');
console.log('  4. No serviço web "trampolim" → Environment:');
console.log('       DATABASE_URL = (cole a string do Neon)  OU use a do Render DB');
console.log('       FRONTEND_URL = https://SEU-APP.onrender.com');
console.log('       MERCADOPAGO_ACCESS_TOKEN = ...');
console.log('       MERCADOPAGO_PUBLIC_KEY = ...');
console.log('       MERCADOPAGO_WEBHOOK_URL = https://SEU-APP.onrender.com/api/payments/webhook');
console.log('');
console.log('PASSO 3 — Validar');
console.log('  npm run deploy:validate -- https://SEU-APP.onrender.com');
console.log('  Abra /api/health e confira database.connected = true');
console.log('');

openUrl(NEON_URL);
setTimeout(() => openUrl(BLUEPRINT_URL), 800);

console.log('Abrindo Neon Console e Render Blueprint...');
console.log('Painel Render geral:', RENDER_ENV_DOCS);
console.log('');
