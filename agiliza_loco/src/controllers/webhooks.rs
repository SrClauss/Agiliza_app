use crate::models::_entities::professional_profiles;
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use stripe::Webhook;

#[debug_handler]
async fn stripe_payment_update(
    State(ctx): State<AppContext>,
    headers: axum::http::HeaderMap,
    body: String,
) -> Result<Response> {
    let webhook_secret = match std::env::var("STRIPE_WEBHOOK_SECRET") {
        Ok(secret) if !secret.is_empty() => secret,
        _ => {
            tracing::warn!("STRIPE_WEBHOOK_SECRET não configurado nas variáveis de ambiente.");
            return format::json(serde_json::json!({
                "status": "warning",
                "message": "STRIPE_WEBHOOK_SECRET não configurado."
            }));
        }
    };

    let signature = match headers.get("Stripe-Signature").and_then(|v| v.to_str().ok()) {
        Some(sig) => sig,
        None => {
            return format::json(serde_json::json!({
                "status": "error",
                "message": "Cabeçalho Stripe-Signature ausente."
            }));
        }
    };

    let event = match Webhook::construct_event(&body, signature, &webhook_secret) {
        Ok(ev) => ev,
        Err(e) => {
            return format::json(serde_json::json!({
                "status": "error",
                "message": format!("Assinatura do Webhook falhou: {:?}", e)
            }));
        }
    };

    match event.type_ {
        stripe::EventType::CheckoutSessionCompleted => {
            if let stripe::EventObject::CheckoutSession(session) = event.data.object {
                if let Some(client_ref) = session.client_reference_id {
                    if let Ok(prof_id) = uuid::Uuid::parse_str(&client_ref) {
                        if let Some(prof) = professional_profiles::Entity::find_by_id(prof_id).one(&ctx.db).await? {
                            let mut active: professional_profiles::ActiveModel = prof.into();
                            active.subscription_status = Set("active".to_string());
                            active.subscription_plan = Set("pro".to_string()); // Default to pro for now
                            
                            // Save the customer ID and subscription ID for future reference
                            if let Some(customer) = session.customer {
                                active.payment_gateway_customer_id = Set(Some(customer.id().as_str().to_string()));
                            }
                            if let Some(subscription) = session.subscription {
                                active.payment_gateway_subscription_id = Set(Some(subscription.id().as_str().to_string()));
                            }
                            
                            active.subscription_end_date = Set(Some(chrono::Utc::now().into()));
                            let _ = active.update(&ctx.db).await?;
                        }
                    }
                }
            }
        }
        stripe::EventType::InvoicePaymentSucceeded => {
            if let stripe::EventObject::Invoice(invoice) = event.data.object {
                if let Some(customer) = invoice.customer {
                    let customer_id = customer.id().as_str().to_string();
                    if let Some(prof) = professional_profiles::Entity::find()
                        .filter(professional_profiles::Column::PaymentGatewayCustomerId.eq(customer_id))
                        .one(&ctx.db)
                        .await?
                    {
                        let mut active: professional_profiles::ActiveModel = prof.into();
                        active.subscription_status = Set("active".to_string());
                        // Add 30 days
                        active.subscription_end_date = Set(Some((chrono::Utc::now() + chrono::Duration::days(30)).into()));
                        let _ = active.update(&ctx.db).await?;
                    }
                }
            }
        }
        stripe::EventType::CustomerSubscriptionDeleted => {
            if let stripe::EventObject::Subscription(subscription) = event.data.object {
                let subscription_id = subscription.id.as_str().to_string();
                if let Some(prof) = professional_profiles::Entity::find()
                    .filter(professional_profiles::Column::PaymentGatewaySubscriptionId.eq(subscription_id))
                    .one(&ctx.db)
                    .await?
                {
                    let mut active: professional_profiles::ActiveModel = prof.into();
                    active.subscription_status = Set("canceled".to_string());
                    let _ = active.update(&ctx.db).await?;
                }
            }
        }
        _ => {
            tracing::info!("Unhandled Stripe event type: {:?}", event.type_);
        }
    }

    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/webhooks")
        .add("/stripe", post(stripe_payment_update))
}
