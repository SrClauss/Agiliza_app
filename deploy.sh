#!/bin/bash
# Script de Deploy Automatizado + Sync Git para a VPS 72.61.48.59 (AgilizaPro)
set -e

COMMIT_MSG="${1:-Deploy automatico VPS 72.61.48.59 - AgilizaPro}"
VPS_IP="72.61.48.59"
VPS_USER="root"
REMOTE_DIR="/opt/agilizapro"

echo "=================================================="
echo "🚀 INICIANDO DEPLOY AUTOMÁTICO DO AGILIZAPRO"
echo "📝 Mensagem do Commit: '$COMMIT_MSG'"
echo "=================================================="

# 1. Compilar o Backend Rust localmente em modo release
echo "🦀 1/4 Compilando Backend Rust (agiliza_loco) localmente em modo --release..."
(cd agiliza_loco && cargo build --release)

# 2. Compilar o Painel Admin React localmente
echo "⚛️ 2/4 Compilando Painel Admin React (agiliza_admin) localmente..."
(cd agiliza_admin && npm run build)

# 3. Fazer Commit e Push para o Repositório Git Privado
echo "🐙 3/4 Atualizando Repositório GitHub (SrClauss/Agiliza_app)..."
git add .
git commit -m "$COMMIT_MSG" || echo "Nenhuma alteração pendente para commit."
git push origin master || echo "Push concluído ou nada a enviar."

# 4. Sincronizar projeto para a VPS via rsync
echo "📦 4/4 Sincronizando código e binários para a VPS ($VPS_USER@$VPS_IP:$REMOTE_DIR)..."
ssh $VPS_USER@$VPS_IP "mkdir -p $REMOTE_DIR"

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'target/debug' \
  --exclude 'venv' \
  --exclude '.venv' \
  ./ $VPS_USER@$VPS_IP:$REMOTE_DIR/

# 5. Subir a infraestrutura Docker na VPS
echo "🐳 Subindo infraestrutura Docker (Postgres, Redis, MinIO, Nginx, App, Admin, API) na VPS..."
ssh $VPS_USER@$VPS_IP "systemctl stop nginx || true"
ssh $VPS_USER@$VPS_IP "mkdir -p /opt/agilizapro/certbot/conf/live/agilizapro.net && cp -rL /etc/letsencrypt/live/admin.agilizapro.net/* /opt/agilizapro/certbot/conf/live/agilizapro.net/ 2>/dev/null || true"
ssh $VPS_USER@$VPS_IP "docker rm -f agiliza_redis agiliza_postgres agiliza_minio agiliza_backend agiliza_web agiliza_admin agiliza_proxy agiliza_certbot || true"
ssh $VPS_USER@$VPS_IP "cd $REMOTE_DIR && docker compose down --remove-orphans && docker compose up -d --build"

echo "=================================================="
echo "✅ DEPLOY E SYNC GIT CONCLUÍDOS COM SUCESSO!"
echo "🌐 App Web:      https://app.agilizapro.net (ou https://$VPS_IP)"
echo "👑 Painel Admin:  https://admin.agilizapro.net"
echo "🦀 Backend API:   https://api.agilizapro.net"
echo "🪣 Storage S3:    https://storage.agilizapro.net"
echo "=================================================="
