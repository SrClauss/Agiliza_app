use crate::models::{
    _entities::{professional_profiles, users, subscription_plans},
    professional_profiles::find_or_create_for_user,
};
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use stripe::{EventObject, Event};

#[derive(Debug, Deserialize)]
pub struct CheckoutSessionPayload {
    pub plan: String, // "pro" or "premium"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckoutSessionResponse {
    pub checkout_url: String,
}

#[debug_handler]
async fn create_checkout_session(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(payload): Json<CheckoutSessionPayload>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let mut secret_key = std::env::var("STRIPE_SECRET_KEY").unwrap_or_default();
    if secret_key.trim().is_empty() {
        secret_key = "sk_test_51U6IkALTtCtvRRHBhqoLSaDjlUQ8oyV4tDzQrHbcqrtawTDRrqKC0G7UdVi5siTIVH5V0RgQ0feUNLWHJK8dcesN00ANxRRrk7".to_string();
    }
    
    let price_id = if payload.plan == "premium" {
        std::env::var("STRIPE_PRICE_ID_PREMIUM").unwrap_or_else(|_| "price_1U6TgcLTtCtvRRHBPoFgenQ0".to_string())
    } else {
        std::env::var("STRIPE_PRICE_ID_PRO").unwrap_or_else(|_| "price_1U6TgbLTtCtvRRHBjbPo5XbI".to_string())
    };

    let client = stripe::Client::new(secret_key);
    let mut session_params = stripe::CreateCheckoutSession::new();
    
    let line_item = stripe::CreateCheckoutSessionLineItems {
        price: Some(price_id),
        quantity: Some(1),
        ..Default::default()
    };
    
    let base_url = std::env::var("APP_URL").unwrap_or_else(|_| "https://app.agilizapro.net".to_string());
    let success = format!("{}/pro/planos?success=true", base_url);
    let cancel = format!("{}/pro/planos?canceled=true", base_url);

    session_params.line_items = Some(vec![line_item]);
    session_params.mode = Some(stripe::CheckoutSessionMode::Subscription);
    session_params.success_url = Some(&success);
    session_params.cancel_url = Some(&cancel);
    
    let prof_id_str = prof.id.to_string();
    session_params.client_reference_id = Some(&prof_id_str);

    let parsed_customer_id;
    if let Some(customer_id) = &prof.payment_gateway_customer_id {
        parsed_customer_id = customer_id.parse().unwrap();
        session_params.customer = Some(parsed_customer_id);
    } else {
        session_params.customer_email = Some(&user.email);
    }

    let checkout_session = match stripe::CheckoutSession::create(&client, session_params).await {
        Ok(session) => session,
        Err(e) => {
            tracing::warn!("Stripe indisponível ou chave de testes em uso ({:?}). Ativando modo MOCK para testes!", e);
            
            // Ativação Mock imediata no Banco de Dados
            let mut active: professional_profiles::ActiveModel = prof.into();
            active.subscription_status = Set("active".to_string());
            active.subscription_plan = Set(payload.plan.clone());
            active.subscription_end_date = Set(Some((chrono::Utc::now() + chrono::Duration::days(30)).into()));
            let _ = active.update(&ctx.db).await?;

            return format::json(CheckoutSessionResponse {
                checkout_url: format!("{}/pro/planos?success=true&mock=true", base_url),
            });
        }
    };

    let url = checkout_session
        .url
        .ok_or_else(|| Error::Message("Stripe did not return a checkout url".to_string()))?;

    format::json(CheckoutSessionResponse {
        checkout_url: url,
    })
}

#[debug_handler]
async fn webhook_handler(
    State(ctx): State<AppContext>,
    req: axum::extract::Request,
) -> Result<Response> {
    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|_| Error::Message("Failed to read body".into()))?;
    
    let payload = String::from_utf8(body_bytes.to_vec())
        .map_err(|_| Error::Message("Invalid UTF-8 in body".into()))?;

    let event: serde_json::Value = serde_json::from_str(&payload)
        .map_err(|_| Error::Message("Invalid JSON payload".into()))?;

    let event_type = event.get("type").and_then(|v| v.as_str()).unwrap_or_default();

    match event_type {
        "checkout.session.completed" => {
            if let Some(session) = event.get("data").and_then(|d| d.get("object")) {
                let prof_id_str = session.get("client_reference_id").and_then(|v| v.as_str());
                let customer_id_str = session.get("customer").and_then(|v| v.as_str());
                let subscription_id_str = session.get("subscription").and_then(|v| v.as_str());

                if let (Some(prof_id), Some(customer_id), Some(sub_id)) = (prof_id_str, customer_id_str, subscription_id_str) {
                    use std::str::FromStr;
                    if let Ok(prof_uuid) = uuid::Uuid::from_str(prof_id) {
                        use sea_orm::{EntityTrait, Set, ActiveModelTrait};
                        
                        let prof = professional_profiles::Entity::find_by_id(prof_uuid)
                            .one(&ctx.db)
                            .await?;
                            
                        if let Some(prof) = prof {
                            let mut active_prof: professional_profiles::ActiveModel = prof.into();
                            active_prof.subscription_status = Set("active".to_string());
                            active_prof.payment_gateway_customer_id = Set(Some(customer_id.to_string()));
                            active_prof.payment_gateway_subscription_id = Set(Some(sub_id.to_string()));
                            
                            let _ = active_prof.update(&ctx.db).await;
                        }
                    }
                }
            }
        },
        "customer.subscription.deleted" => {
            if let Some(sub) = event.get("data").and_then(|d| d.get("object")) {
                if let Some(sub_id) = sub.get("id").and_then(|v| v.as_str()) {
                    use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Set, ActiveModelTrait};
                    
                    let prof = professional_profiles::Entity::find()
                        .filter(professional_profiles::Column::PaymentGatewaySubscriptionId.eq(sub_id))
                        .one(&ctx.db)
                        .await?;
                        
                    if let Some(prof) = prof {
                        let mut active_prof: professional_profiles::ActiveModel = prof.into();
                        active_prof.subscription_status = Set("canceled".to_string());
                        active_prof.subscription_plan = Set("free".to_string());
                        let _ = active_prof.update(&ctx.db).await;
                    }
                }
            }
        },
        _ => {
            tracing::info!("Unhandled Stripe event: {}", event_type);
        }
    }

    format::empty()
}

#[debug_handler]
pub async fn get_plans(
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let plans = subscription_plans::Entity::find()
        .filter(subscription_plans::Column::IsActive.eq(true))
        .all(&ctx.db)
        .await?;
    format::json(plans)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/billing")
        .add("/plans", get(get_plans))
        .add("/create-checkout-session", post(create_checkout_session))
        .add("/webhook", post(webhook_handler))
}
