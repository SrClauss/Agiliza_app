use crate::models::_entities::{favorites, professional_profiles, users};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateFavoriteParams {
    pub professional_profile: uuid::Uuid,
}

#[debug_handler]
async fn list_favorites(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let favs = favorites::Entity::find()
        .filter(favorites::Column::ClientId.eq(user.id))
        .all(&ctx.db)
        .await?;

    format::json(favs)
}

#[debug_handler]
async fn create_favorite(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateFavoriteParams>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;

    let prof = professional_profiles::Entity::find_by_id(params.professional_profile)
        .one(&ctx.db)
        .await?;

    let Some(prof) = prof else {
        return not_found();
    };

    if prof.user_id == user.id {
        return bad_request("You cannot save your own professional profile.");
    }

    let fav = favorites::ActiveModel {
        client_id: Set(user.id),
        professional_profile_id: Set(prof.id),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    format::json(fav)
}

#[debug_handler]
async fn delete_favorite(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let fav = favorites::Entity::find_by_id(id)
        .filter(favorites::Column::ClientId.eq(user.id))
        .one(&ctx.db)
        .await?;

    if let Some(f) = fav {
        f.delete(&ctx.db).await?;
        format::empty_json()
    } else {
        not_found()
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth/favorites")
        .add("/", get(list_favorites).post(create_favorite))
        .add("/{id}", delete(delete_favorite))
}
