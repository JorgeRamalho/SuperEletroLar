# Banco de dados — Trampolim (local + produção)

## Local (desenvolvimento)

Ao iniciar a API sem `DATABASE_URL`, o sistema usa **SQLite**:

- Arquivo: `backend/data/trampolim.db`
- Cadastro, login e perfil são persistidos automaticamente
- Não precisa instalar PostgreSQL no PC

```bash
cd backend
npm install
npm run dev
# Abra http://localhost:4000/api/health ? mode: "sqlite"
```

## Produção — Render + Neon

### Opção A — PostgreSQL do Render (Blueprint)

1. Rode: `npm run deploy:render`
2. No painel Render, aplique o Blueprint (`render.yaml`)
3. O serviço `trampolim` já recebe `DATABASE_URL` do banco `trampolim-db`

### Opção B — Neon (recomendado)

1. Crie um projeto em [console.neon.tech](https://console.neon.tech)
2. Copie a **connection string** (com `?sslmode=require`)
3. No Render ? serviço web ? **Environment**:
   - `DATABASE_URL` = string do Neon
   - `FRONTEND_URL` = `https://SEU-APP.onrender.com`
   - `JWT_SECRET` = (já gerado pelo Blueprint, ou defina um)
   - `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_PUBLIC_KEY` / `MERCADOPAGO_WEBHOOK_URL`
4. Redeploy do serviço

O backend aceita também `POSTGRES_URL` ou `NEON_DATABASE_URL` como alias de `DATABASE_URL`.

### Variáveis obrigatórias em produção

| Variável | Origem |
|---|---|
| `DATABASE_URL` | Render DB ou Neon |
| `JWT_SECRET` | Render (generateValue) |
| `NODE_ENV=production` | Blueprint |
| `FRONTEND_URL` | URL pública do app |
| `MERCADOPAGO_*` | Painel Mercado Pago (opcional no início) |

Modelo completo: `backend/.env.production.example`

## Endpoints

| Método | Rota | Função |
|---|---|---|
| POST | `/api/auth/register` | Cria cliente no banco |
| POST | `/api/auth/login` | Autentica |
| GET | `/api/auth/me` | Lê perfil |
| PUT | `/api/auth/me` | Atualiza perfil |
| GET | `/api/health` | Status do banco |

## Validar produção

```bash
npm run deploy:validate -- https://SEU-APP.onrender.com
```

Esperado em `/api/health`:

```json
{
  "storage": "postgres",
  "database": {
    "connected": true,
    "mode": "postgres",
    "message": "PostgreSQL OK — N usuários, M pedidos"
  }
}
```
