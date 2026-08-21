use crate::models::{
    _entities::{professional_profiles, reviews, users},
    reviews::Model as ReviewModel,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateReviewParams {
    pub professional_profile: uuid::Uuid,
    pub rating: i32,
    pub comment: Option<String>,
}

#[debug_handler]
async fn list_reviews(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let r_list = reviews::Entity::find()
        .filter(reviews::Column::ClientId.eq(user.id))
        .all(&ctx.db)
        .await?;

    format::json(r_list)
}

#[debug_handler]
async fn create_review(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateReviewParams>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;

    if params.rating < 1 || params.rating > 5 {
        return bad_request("Rating must be between 1 and 5.");
    }

    let prof = professional_profiles::Entity::find_by_id(params.professional_profile)
        .one(&ctx.db)
        .await?;

    let Some(prof) = prof else {
        return not_found();
    };

    if prof.user_id == user.id {
        return bad_request("You cannot review your own professional profile.");
    }

    let rev = reviews::ActiveModel {
        client_id: Set(user.id),
        professional_profile_id: Set(prof.id),
        rating: Set(params.rating),
        comment: Set(params.comment),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    let _ = ReviewModel::update_professional_rating(&ctx.db, prof.id).await;

    format::json(rev)
}

#[debug_handler]
async fn delete_review(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let rev = reviews::Entity::find_by_id(id)
        .filter(reviews::Column::ClientId.eq(user.id))
        .one(&ctx.db)
        .await?;

    if let Some(r) = rev {
        let prof_id = r.professional_profile_id;
        r.delete(&ctx.db).await?;
        let _ = ReviewModel::update_professional_rating(&ctx.db, prof_id).await;
        format::empty_json()
    } else {
        not_found()
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth/reviews")
        .add("/", get(list_reviews).post(create_review))
        .add("/{id}", delete(delete_review))
}
