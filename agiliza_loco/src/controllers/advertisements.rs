use crate::models::_entities::advertisements;
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set, Condition};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, DateTime};

#[derive(Debug, Deserialize)]
pub struct CreateAdPayload {
    pub ad_type: String, // "PROFESSIONAL_DIRECT" or "EXTERNAL_LINK"
    pub title: String,
    pub subtitle: Option<String>,
    pub banner_image_url: String,
    pub target_url: Option<String>,
    pub professional_user_id: Option<Uuid>,
    pub category_id: Option<String>,
    pub duration_days: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAdStatusPayload {
    pub status: String, // "ACTIVE", "REJECTED", "EXPIRED"
}

// 1. Listar anúncios ativos para o Cliente (apenas ativos e dentro da validade)
#[debug_handler]
async fn list_active_ads(State(ctx): State<AppContext>) -> Result<Response> {
    let now: sea_orm::prelude::DateTimeWithTimeZone = Utc::now().into();

    let ads = advertisements::Entity::find()
        .filter(advertisements::Column::Status.eq("ACTIVE"))
        .filter(
            Condition::any()
                .add(advertisements::Column::ExpiresAt.is_null())
                .add(advertisements::Column::ExpiresAt.gt(now))
        )
        .order_by_desc(advertisements::Column::Priority)
        .all(&ctx.db)
        .await?;

    format::json(ads)
}

// 2. Listar TODOS os anúncios para o Painel Admin
#[debug_handler]
async fn list_admin_ads(_auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let ads = advertisements::Entity::find()
        .order_by_desc(advertisements::Column::CreatedAt)
        .all(&ctx.db)
        .await?;

    format::json(ads)
}

// 3. Criar nova proposta de anúncio (Profissional ou Admin)
#[debug_handler]
async fn create_ad(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(payload): Json<CreateAdPayload>,
) -> Result<Response> {
    let user_id = Uuid::parse_str(&auth.claims.pid).map_err(|e| Error::BadRequest(e.to_string()))?;
    
    let days = payload.duration_days.unwrap_or(30);
    let expires_at: sea_orm::prelude::DateTimeWithTimeZone = (Utc::now() + chrono::Duration::days(days)).into();

    let ad_id = Uuid::new_v4();
    let new_ad = advertisements::ActiveModel {
        id: Set(ad_id),
        ad_type: Set(payload.ad_type),
        title: Set(payload.title),
        subtitle: Set(payload.subtitle),
        banner_image_url: Set(payload.banner_image_url),
        target_url: Set(payload.target_url),
        professional_user_id: Set(payload.professional_user_id.or(Some(user_id))),
        category_id: Set(payload.category_id),
        status: Set("PENDING_APPROVAL".to_string()),
        priority: Set(0),
        expires_at: Set(Some(expires_at)),
        ..Default::default()
    };

    let item = new_ad.insert(&ctx.db).await?;
    format::json(item)
}

// 4. Admin Aprovar ou Rejeitar Anúncio
#[debug_handler]
async fn update_ad_status(
    _auth: auth::JWT,
    Path(ad_id): Path<Uuid>,
    State(ctx): State<AppContext>,
    Json(payload): Json<UpdateAdStatusPayload>,
) -> Result<Response> {
    let ad = advertisements::Entity::find_by_id(ad_id)
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let mut active: advertisements::ActiveModel = ad.into();
    active.status = Set(payload.status);
    let updated = active.update(&ctx.db).await?;

    format::json(updated)
}

// 5. Admin EXCLUIR Anúncio
#[debug_handler]
async fn delete_ad(
    _auth: auth::JWT,
    Path(ad_id): Path<Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let ad = advertisements::Entity::find_by_id(ad_id)
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    ad.delete(&ctx.db).await?;

    format::json(serde_json::json!({
        "success": true,
        "message": "Anúncio excluído com sucesso."
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/advertisements")
        .add("/", get(list_active_ads))
        .add("/", post(create_ad))
        .add("/admin/all", get(list_admin_ads))
        .add("/admin/{ad_id}/status", put(update_ad_status))
        .add("/admin/{ad_id}", delete(delete_ad))
}
