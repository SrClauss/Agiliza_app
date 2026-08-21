#!/bin/bash

# Define o diretorio raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Iniciando os servicos independentes da plataforma AgilizaPro em background..."

# 1. Carrega as variaveis do Stripe/Ambiente se existirem no .env do backend
if [ -f "$ROOT_DIR/agiliza_loco/.env" ]; then
    export $(grep -v '^#' "$ROOT_DIR/agiliza_loco/.env" | xargs)
fi

# Fallback das variaveis do Stripe se nao estiverem exportadas
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_51U6IkALTtCtvRRHBhqoLSaDjlUQ8oyV4tDzQrHbcqrtawTDRrqKC0G7UdVi5siTIVH5V0RgQ0feUNLWHJK8dcesN00ANxRRrk7}"
export STRIPE_PUBLIC_KEY="${STRIPE_PUBLIC_KEY:-pk_test_51U6IkALTtCtvRRHBnQdvWLkTvvDBIvxjIJtEgKI8knnEiWrFJQKphvUa4XHJf32ASTOG9K17UZV0I1CXZFyThO1F0016s5Tste}"
export STRIPE_PRICE_ID_PRO="${STRIPE_PRICE_ID_PRO:-price_1U6TgbLTtCtvRRHBjbPo5XbI}"
export STRIPE_PRICE_ID_PREMIUM="${STRIPE_PRICE_ID_PREMIUM:-price_1U6TgcLTtCtvRRHBPoFgenQ0}"

# 2. Iniciar o Backend em Rust (Loco) na porta 5150
echo "🦀 Subindo Backend Rust (agiliza_loco) na porta 5150..."
cd "$ROOT_DIR/agiliza_loco" || exit 1
cargo build > /dev/null 2>&1
nohup ./target/debug/agiliza_loco-cli start > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$ROOT_DIR/.backend.pid"

# 3. Iniciar o App do Cliente/Profissional (agiliza_web - Next.js) na porta 3000
echo "🌐 Subindo App Web Next.js (agiliza_web) na porta 3000..."
cd "$ROOT_DIR/agiliza_web" || exit 1
nohup npm run dev -- --port 3000 --webpack > "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$ROOT_DIR/.frontend.pid"

# 4. Iniciar o Painel Administrativo ISOLADO (agiliza_admin - Vite) na porta 3001
echo "👑 Subindo Painel Admin ISOLADO (agiliza_admin) na porta 3001..."
cd "$ROOT_DIR/agiliza_admin" || exit 1
nohup npx vite --host 0.0.0.0 --port 3001 > "$ROOT_DIR/admin.log" 2>&1 &
ADMIN_PID=$!
echo "$ADMIN_PID" > "$ROOT_DIR/.admin.pid"

echo ""
echo "=================================================="
echo "✅ Todos os 3 Serviços Isolados Foram Iniciados!"
echo "👉 App Web (Cliente/Pro): http://localhost:3000"
echo "👉 Painel Admin Isolado: http://localhost:3001"
echo "👉 Backend REST/WS:      http://localhost:5150"
echo "=================================================="
