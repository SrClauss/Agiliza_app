#!/bin/bash

# Atualiza os pacotes
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Adiciona a chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Configura o repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instala o Docker Engine e o Docker Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Inicia e habilita o serviço do Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verifica a instalação
docker --version
docker compose version

echo "Docker e Docker Compose instalados com sucesso!"
