#!/bin/bash
# Script de Deploy Otimizado + Selective Container Restart (AgilizaPro)
set -e

COMMIT_MSG=""
TARGET_SERVICES=""
FORCE_ALL=false

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message)
      COMMIT_MSG="$2"
      shift 2
      ;;
    -c|--containers|--services)
      TARGET_SERVICES="$2"
      shift 2
      ;;
    --all)
      FORCE_ALL=true
      shift
      ;;
    *)
      if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="$1"
      elif [ -z "$TARGET_SERVICES" ]; then
        TARGET_SERVICES="$1"
      fi
      shift
      ;;
  esac
done

COMMIT_MSG="${COMMIT_MSG:-Deploy automatico VPS 72.61.48.59 - AgilizaPro}"
VPS_IP="72.61.48.59"
VPS_USER="root"
REMOTE_DIR="/opt/agilizapro"

# Detect modified areas if TARGET_SERVICES is not set and not FORCE_ALL
BUILD_BACKEND=false
BUILD_ADMIN=false
BUILD_WEB=false

if [ "$FORCE_ALL" = "true" ] || [ "$TARGET_SERVICES" = "all" ]; then
  BUILD_BACKEND=true
  BUILD_ADMIN=true
  BUILD_WEB=true
  DOCKER_SERVICES=""
elif [ -n "$TARGET_SERVICES" ]; then
  case "$TARGET_SERVICES" in
    *backend*|*loco*) BUILD_BACKEND=true ;;
  esac
  case "$TARGET_SERVICES" in
    *admin*) BUILD_ADMIN=true ;;
  esac
  case "$TARGET_SERVICES" in
    *web*) BUILD_WEB=true ;;
  esac

  DOCKER_SERVICES=""
  [ "$BUILD_BACKEND" = "true" ] && DOCKER_SERVICES="$DOCKER_SERVICES agiliza_loco"
  [ "$BUILD_WEB" = "true" ] && DOCKER_SERVICES="$DOCKER_SERVICES agiliza_web"
  [ "$BUILD_ADMIN" = "true" ] && DOCKER_SERVICES="$DOCKER_SERVICES agiliza_admin"
else
  # Auto-detect via git status
  CHANGED_FILES=$(git status --porcelain | awk '{print $2}')
  if echo "$CHANGED_FILES" | grep -q "^agiliza_loco/"; then
    BUILD_BACKEND=true
  fi
  if echo "$CHANGED_FILES" | grep -q "^agiliza_admin/"; then
    BUILD_ADMIN=true
  fi
  if echo "$CHANGED_FILES" | grep -q "^agiliza_web/"; then
    BUILD_WEB=true
  fi

  # Fallback if no specific directory matched
  if [ "$BUILD_BACKEND" = "false" ] && [ "$BUILD_ADMIN" = "false" ] && [ "$BUILD_WEB" = "false" ]; then
    BUILD_BACKEND=true
    BUILD_ADMIN=true
    BUILD_WEB=true
  fi

  DOCKER_SERVICES=""
  [ "$BUILD_BACKEND" = "true" ] && DOCKER_SERVICES="$DOCKER_SERVICES agiliza_loco"
  [ "$BUILD_WEB" = "true" ] && DOCKER_SERVICES="$DOCKER_SERVICES agiliza_web"
  [ "$BUILD_ADMIN" = "true" ] && DOCKER_SERVICES="$DOCKER_SERVICES agiliza_admin"
fi

echo "=================================================="
echo "🚀 INICIANDO DEPLOY SELETIVO DO AGILIZAPRO"
echo "📝 Commit: '$COMMIT_MSG'"
echo "🎯 Containers Afetados: ${DOCKER_SERVICES:-Todos os Containers}"
echo "=================================================="

# 1. Compilações locais seletivas
if [ "$BUILD_BACKEND" = "true" ]; then
  echo "🦀 Compilando Backend Rust (agiliza_loco) em modo release..."
  (cd agiliza_loco && cargo build --release)
fi

if [ "$BUILD_ADMIN" = "true" ]; then
  echo "⚛️ Compilando Painel Admin React (agiliza_admin)..."
  (cd agiliza_admin && npm run build)
fi

# 2. Sync Git
echo "🐙 Atualizando Repositório GitHub (SrClauss/Agiliza_app)..."
git add .
git commit -m "$COMMIT_MSG" || echo "Nenhuma alteração pendente para commit."
git push origin master || echo "Push concluído ou nada a enviar."

# 3. Rsync
echo "📦 Sincronizando arquivos para a VPS ($VPS_USER@$VPS_IP:$REMOTE_DIR)..."
ssh $VPS_USER@$VPS_IP "mkdir -p $REMOTE_DIR"

rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'target/debug' \
  --exclude 'venv' \
  --exclude '.venv' \
  --exclude 'certbot' \
  ./ $VPS_USER@$VPS_IP:$REMOTE_DIR/

# 4. Atualizar Docker na VPS
if [ "$FORCE_ALL" = "true" ] || [ "$TARGET_SERVICES" = "all" ]; then
  echo "🐳 Reiniciando TODOS os containers na VPS..."
  ssh $VPS_USER@$VPS_IP "cd $REMOTE_DIR && docker compose down --remove-orphans || true"
  ssh $VPS_USER@$VPS_IP "cd $REMOTE_DIR && docker compose up -d --build"
else
  echo "🐳 Reconstruindo e reiniciando apenas os containers: $DOCKER_SERVICES..."
  ssh $VPS_USER@$VPS_IP "cd $REMOTE_DIR && docker compose up -d --build --no-deps $DOCKER_SERVICES"
fi

echo "=================================================="
echo "✅ DEPLOY SELETIVO CONCLUÍDO COM SUCESSO!"
echo "🌐 App Web:      https://app.agilizapro.net (ou https://$VPS_IP)"
echo "👑 Painel Admin:  https://admin.agilizapro.net"
echo "🦀 Backend API:   https://api.agilizapro.net"
echo "🪣 Storage S3:    https://storage.agilizapro.net"
echo "=================================================="
