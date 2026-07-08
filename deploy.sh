#!/usr/bin/env bash
set -e

echo "============================================"
echo "  Trampolim - Deploy Script"
echo "============================================"

echo "[1/4] Instalando dependências..."
npm run install:all

echo "[2/4] Build de produção (React)..."
npm run build

echo "[3/4] Verificando saúde do build..."
test -f react/dist/index.html || { echo "ERRO: react/dist não encontrado"; exit 1; }
test -f index.html || { echo "ERRO: index.html não encontrado"; exit 1; }

echo "[4/4] Iniciando servidor de produção..."
echo ""
echo "  Site HTML:  http://localhost:4000"
echo "  React App:  http://localhost:4000/app"
echo "  API Health: http://localhost:4000/api/health"
echo ""

export NODE_ENV=production
node backend/server.js
