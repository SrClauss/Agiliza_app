#!/bin/bash

# Script de deploy rápido: Compila localmente e joga no servidor via SSH/SCP

SERVER="root@72.61.48.59"
DEST_DIR="/var/www/agiliza_backend"
SERVICE_NAME="agiliza"

echo "1. Compilando o projeto localmente via Docker (para garantir compatibilidade com o Ubuntu do servidor)..."
docker run --rm -v "$PWD":/usr/src/myapp -w /usr/src/myapp rust:1.92.0-bullseye cargo build --release

if [ $? -ne 0 ]; then
    echo "Erro na compilação. Abortando deploy."
    exit 1
fi

echo "2. Preparando servidor (criando diretórios remotamente)..."
ssh -o StrictHostKeyChecking=no $SERVER "mkdir -p $DEST_DIR/config"

echo "3. Copiando o binário..."
scp -o StrictHostKeyChecking=no target/release/agiliza_loco-cli $SERVER:$DEST_DIR/

echo "4. Copiando configurações de produção..."
scp -o StrictHostKeyChecking=no config/production.yaml $SERVER:$DEST_DIR/config/

echo "5. Reiniciando o serviço no servidor..."
ssh -o StrictHostKeyChecking=no $SERVER "systemctl restart $SERVICE_NAME"

echo "Deploy finalizado com sucesso! O backend foi atualizado e reiniciado no servidor."
