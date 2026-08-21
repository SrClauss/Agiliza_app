#!/bin/bash
# Script de automação SSL Let's Encrypt para agilizapro.net na VPS 72.61.48.59

DOMAIN="agilizapro.net"
EMAIL="contato@agilizapro.net"

echo "🔐 Gerando Certificado SSL Let's Encrypt para $DOMAIN e subdomínio..."

mkdir -p certbot/conf certbot/www

docker run -it --rm --name temp_certbot \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d agilizapro.net \
  -d www.agilizapro.net \
  -d app.agilizapro.net \
  -d admin.agilizapro.net \
  -d api.agilizapro.net \
  -d storage.agilizapro.net \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email

echo "✅ Certificado SSL gerado com sucesso!"
