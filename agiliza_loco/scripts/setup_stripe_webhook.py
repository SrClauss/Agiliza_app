import urllib.request
import urllib.parse
import json
import os

# Insira aqui a sua Secret Key do Stripe (sk_test_... ou sk_live_...)
STRIPE_SECRET_KEY = os.environ.get(
    "STRIPE_SECRET_KEY", 
    "sk_test_51U6IkALTtCtvRRHBhqoLSaDjlUQ8oyV4tDzQrHbcqrtawTDRrqKC0G7UdVi5siTIVH5V0RgQ0feUNLWHJK8dcesN00ANxRRrk7"
)

# A URL pública do seu servidor backend onde o Stripe deve enviar as notificações
WEBHOOK_DESTINATION_URL = "https://seu-dominio-ou-ngrok.com/api/billing/webhook"

def create_stripe_webhook(target_url):
    api_url = "https://api.stripe.com/v1/webhook_endpoints"
    
    # Eventos que o nosso backend escuta
    events = [
        "checkout.session.completed",
        "customer.subscription.deleted",
        "customer.subscription.updated"
    ]
    
    # Formata os dados para o formato que a API REST do Stripe aceita
    params = [("url", target_url)]
    for event in events:
        params.append(("enabled_events[]", event))
        
    encoded_data = urllib.parse.urlencode(params).encode("utf-8")
    
    req = urllib.request.Request(
        api_url,
        data=encoded_data,
        headers={
            "Authorization": f: "Bearer {STRIPE_SECRET_KEY}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            print("==================================================")
            print("✅ WEBHOOK CONFIGURADO COM SUCESSO NO STRIPE VIA API!")
            print(f"ID do Endpoint: {result.get('id')}")
            print(f"URL Cadastrada: {result.get('url')}")
            print(f"Chave Secreta do Webhook (whsec_...): {result.get('secret')}")
            print("==================================================")
            print("Guarde o 'secret' retornado acima e coloque no seu .env em STRIPE_WEBHOOK_SECRET!")
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"❌ Erro ao criar Webhook no Stripe: {e.code}")
        print(f"Detalhes: {error_body}")
    except Exception as e:
        print(f"❌ Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    print("Iniciando registro de Webhook Endpoint na API do Stripe...")
    create_stripe_webhook(WEBHOOK_DESTINATION_URL)
