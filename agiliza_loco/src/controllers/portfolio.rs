use crate::models::{
    _entities::{portfolio_items, users},
    professional_profiles::find_or_create_for_user,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreatePortfolioParams {
    pub title: String,
    pub description: Option<String>,
    pub image: Option<String>,
}

#[debug_handler]
async fn list_portfolio(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let items = portfolio_items::Entity::find()
        .filter(portfolio_items::Column::ProfessionalProfileId.eq(prof.id))
        .all(&ctx.db)
        .await?;

    format::json(items)
}

#[debug_handler]
async fn create_portfolio(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreatePortfolioParams>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let item = portfolio_items::ActiveModel {
        professional_profile_id: Set(prof.id),
        title: Set(params.title),
        description: Set(params.description),
        image: Set(params.image),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    format::json(item)
}

#[debug_handler]
async fn delete_portfolio(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = find_or_create_for_user(&ctx.db, user.id).await?;

    let item = portfolio_items::Entity::find_by_id(id)
        .filter(portfolio_items::Column::ProfessionalProfileId.eq(prof.id))
        .one(&ctx.db)
        .await?;

    if let Some(item) = item {
        item.delete(&ctx.db).await?;
        format::empty_json()
    } else {
        not_found()
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth/portfolio")
        .add("/", get(list_portfolio).post(create_portfolio))
        .add("/{id}", delete(delete_portfolio))
}
