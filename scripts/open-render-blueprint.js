/**
 * Abre o painel Render para aplicar o Blueprint do SuperEletroLar.
 * O Blueprint só pode ser aplicado com login na sua conta Render.
 *
 * Uso: node scripts/open-render-blueprint.js
 */
import { execSync } from 'child_process';

const REPO = 'https://github.com/JorgeRamalho/SuperEletroLar';
const BLUEPRINT_URL = 'https://dashboard.render.com/blueprint/new';

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('  SuperEletroLar — Deploy Blueprint no Render');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('Repositório:', REPO);
console.log('');
console.log('Passos no painel Render:');
console.log('  1. Faça login com GitHub');
console.log('  2. Selecione o repo: JorgeRamalho/SuperEletroLar');
console.log('  3. Branch: main');
console.log('  4. Clique em "Deploy Blueprint"');
console.log('');
console.log('Após o deploy, configure no painel do serviço web:');
console.log('  MERCADOPAGO_ACCESS_TOKEN  (sandbox ou produção)');
console.log('  MERCADOPAGO_PUBLIC_KEY');
console.log('  MERCADOPAGO_WEBHOOK_URL   → https://SEU-APP.onrender.com/api/payments/webhook');
console.log('');
console.log('Validar produção:');
console.log('  npm run deploy:validate -- https://super-eletrolar.onrender.com');
console.log('');

try {
  const cmd = process.platform === 'win32' ? `start "" "${BLUEPRINT_URL}"` : `open "${BLUEPRINT_URL}"`;
  execSync(cmd, { stdio: 'ignore' });
  console.log('Abrindo painel Render no navegador...');
} catch {
  console.log('Abra manualmente:', BLUEPRINT_URL);
}
