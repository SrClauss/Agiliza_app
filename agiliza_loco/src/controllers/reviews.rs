use crate::models::{
    _entities::{professional_profiles, reviews, users, service_requests},
    reviews::Model as ReviewModel,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateReviewParams {
    pub professional_profile: uuid::Uuid,
    pub service_request_id: uuid::Uuid,
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

    // Validate service request and check if already reviewed
    let s_req = service_requests::Entity::find_by_id(params.service_request_id).one(&ctx.db).await?;
    let Some(mut s_req) = s_req else {
        return not_found();
    };
    
    if s_req.is_reviewed {
        return bad_request("Este pedido já foi avaliado.");
    }

    let comment_val = params.comment.clone().unwrap_or_default();

    let rev = reviews::ActiveModel {
        client_id: Set(user.id),
        professional_profile_id: Set(prof.id),
        rating: Set(params.rating),
        comment: Set(params.comment),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    // Mark service request as reviewed
    let mut s_req_active: service_requests::ActiveModel = s_req.into();
    s_req_active.is_reviewed = Set(true);
    s_req_active.update(&ctx.db).await?;

    let _ = ReviewModel::update_professional_rating(&ctx.db, prof.id).await;

    // Disparar Push Notification para o profissional
    let db_clone = ctx.db.clone();
    let prof_uid = prof.user_id;
    let reviewer_name = user.name.clone();
    let rating_val = params.rating;

    tokio::spawn(async move {
        let stars = "⭐".repeat(rating_val as usize);
        let body_msg = if !comment_val.is_empty() {
            format!("\"{}\"", comment_val)
        } else {
            "Você recebeu uma nova avaliação de atendimento!".to_string()
        };

        crate::services::push::send_web_push(
            &db_clone,
            prof_uid,
            &format!("{} Nova Avaliação de {}", stars, reviewer_name),
            &body_msg,
            "/pro/perfil"
        ).await;
    });

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
        .prefix("/api/reviews")
        .add("/", get(list_reviews).post(create_review))
        .add("/{id}", delete(delete_review))
}
