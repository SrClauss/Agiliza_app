use crate::models::{
    _entities::{availability_slots, users},
    professional_profiles::find_or_create_for_user,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateSlotParams {
    pub day_of_week: i32,
    pub start_time: String,
    pub end_time: String,
    pub is_active: Option<bool>,
}

#[debug_handler]
async fn list_slots(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let slots = availability_slots::Entity::find()
        .filter(availability_slots::Column::ProfessionalProfileId.eq(prof.id))
        .all(&ctx.db)
        .await?;

    format::json(slots)
}

#[debug_handler]
async fn create_slot(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateSlotParams>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let slot = availability_slots::ActiveModel {
        professional_profile_id: Set(prof.id),
        day_of_week: Set(params.day_of_week),
        start_time: Set(params.start_time),
        end_time: Set(params.end_time),
        is_active: Set(params.is_active.unwrap_or(true)),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    format::json(slot)
}

#[debug_handler]
async fn delete_slot(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let slot = availability_slots::Entity::find_by_id(id)
        .filter(availability_slots::Column::ProfessionalProfileId.eq(prof.id))
        .one(&ctx.db)
        .await?;

    if let Some(s) = slot {
        s.delete(&ctx.db).await?;
        format::empty_json()
    } else {
        not_found()
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth/availability-slots")
        .add("/", get(list_slots).post(create_slot))
        .add("/{id}", delete(delete_slot))
}
