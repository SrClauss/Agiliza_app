#!/bin/bash

# Define o diretorio raiz do projeto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🛑 Encerrando todos os servicos da plataforma AgilizaPro..."

# 1. Matar processo do Backend via PID ou porta 5150
if [ -f "$ROOT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$ROOT_DIR/.backend.pid")
    kill -9 "$BACKEND_PID" 2>/dev/null
    rm -f "$ROOT_DIR/.backend.pid"
fi

# 2. Matar processo do Frontend (agiliza_web) via PID ou porta 3000
if [ -f "$ROOT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$ROOT_DIR/.frontend.pid")
    kill -9 "$FRONTEND_PID" 2>/dev/null
    rm -f "$ROOT_DIR/.frontend.pid"
fi

# 3. Matar processo do Painel Admin (agiliza_admin) via PID ou porta 3001
if [ -f "$ROOT_DIR/.admin.pid" ]; then
    ADMIN_PID=$(cat "$ROOT_DIR/.admin.pid")
    kill -9 "$ADMIN_PID" 2>/dev/null
    rm -f "$ROOT_DIR/.admin.pid"
fi

# 4. Garantir limpeza de processos ocupando as portas 5150 (Backend), 3000 (App Web) e 3001 (Admin)
fuser -k 5150/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null

# 5. Parar qualquer container Docker em execucao na maquina
RUNNING_CONTAINERS=$(docker ps -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
    echo "🐳 Encerrando containers Docker em execucao..."
    docker stop $RUNNING_CONTAINERS >/dev/null 2>&1
fi

echo "=================================================="
echo "✅ Todos os 3 servicos (agiliza_web, agiliza_admin, agiliza_loco) foram encerrados!"
echo "=================================================="
