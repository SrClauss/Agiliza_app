use crate::models::{
    _entities::{quote_responses, service_requests, users},
    professional_profiles::find_or_create_for_user,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateQuoteParams {
    pub service_request: uuid::Uuid,
    pub price: rust_decimal::Decimal,
    pub duration: String,
    pub message: Option<String>,
}

#[debug_handler]
async fn list_quotes(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let quotes = quote_responses::Entity::find()
        .filter(quote_responses::Column::ProfessionalProfileId.eq(prof.id))
        .all(&ctx.db)
        .await?;

    format::json(quotes)
}

#[debug_handler]
async fn create_quote(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateQuoteParams>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let s_req = service_requests::Entity::find_by_id(params.service_request)
        .one(&ctx.db)
        .await?;

    let Some(s_req) = s_req else {
        return not_found();
    };

    if prof.subscription_status != "active" && prof.subscription_status != "trialing" {
        return unauthorized("Your subscription is expired or inactive. Renew to send quotes.");
    }

    if s_req.status != "PENDING" && s_req.status != "QUOTED" {
        return bad_request("Quotes can only be sent for pending or quoted requests.");
    }

    let quote = quote_responses::ActiveModel {
        service_request_id: Set(s_req.id),
        professional_profile_id: Set(prof.id),
        price: Set(params.price),
        duration: Set(params.duration),
        message: Set(params.message),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    if s_req.status == "PENDING" {
        let mut active: service_requests::ActiveModel = s_req.clone().into();
        active.status = Set("QUOTED".to_string());
        active.quoted_price = Set(Some(params.price));
        active.professional_profile_id = Set(Some(prof.id));
        let _ = active.update(&ctx.db).await;
    }

    // Disparar Push Notification para o cliente
    let db_clone = ctx.db.clone();
    let client_uid = s_req.client_id;
    let s_req_title = s_req.title.clone();
    let prof_name = user.name.clone();
    let quote_price = params.price;

    tokio::spawn(async move {
        crate::services::push::send_web_push(
            &db_clone,
            client_uid,
            "💰 Nova Proposta Recebida!",
            &format!("{} enviou uma proposta de R$ {:.2} para \"{}\"", prof_name, quote_price, s_req_title),
            "/cliente/pedidos"
        ).await;
    });

    format::json(quote)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/services/quotes")
        .add("/", get(list_quotes).post(create_quote))
}
