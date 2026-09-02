use crate::models::{
    _entities::{professional_profiles, users, featured_professionals, reviews, professional_profile_categories},
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect, PaginatorTrait, Set};
use serde::{Deserialize, Serialize};
use chrono::Datelike;

#[derive(Debug, Deserialize)]
pub struct SearchQueryParams {
    pub category: Option<String>,
    pub min_rating: Option<f64>,
    pub rating: Option<f64>,
    pub latitude: Option<f64>,
    pub lat: Option<f64>,
    pub longitude: Option<f64>,
    pub lng: Option<f64>,
    pub lon: Option<f64>,
    pub radius_km: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct ProfessionalDto {
    pub id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub email: String,
    pub full_name: String,
    pub bio: Option<String>,
    pub years_experience: i32,
    pub hourly_rate: rust_decimal::Decimal,
    pub service_radius_km: i32,
    pub address: Option<String>,
    pub latitude: Option<rust_decimal::Decimal>,
    pub longitude: Option<rust_decimal::Decimal>,
    pub average_rating: rust_decimal::Decimal,
    pub total_reviews: i32,
    pub subscription_status: String,
    pub profile_image: Option<String>,
    pub categories: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfessionalDto {
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub years_experience: Option<i32>,
    pub hourly_rate: Option<rust_decimal::Decimal>,
    pub service_radius_km: Option<i32>,
    pub address: Option<String>,
    pub latitude: Option<rust_decimal::Decimal>,
    pub longitude: Option<rust_decimal::Decimal>,
    pub categories: Option<Vec<String>>,
}

#[debug_handler]
async fn list_professionals(
    _auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(query): Query<SearchQueryParams>,
) -> Result<Response> {
    let mut db_query = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::SubscriptionStatus.is_in(vec![
            "ACTIVE".to_string(),
            "active".to_string(),
            "TRIALING".to_string(),
            "trialing".to_string(),
        ]))
        .order_by_desc(professional_profiles::Column::AverageRating)
        .order_by_desc(professional_profiles::Column::TotalReviews);

    let min_rating = query.min_rating.or(query.rating);
    if let Some(r) = min_rating {
        if let Some(dec) = rust_decimal::Decimal::from_f64_retain(r) {
            db_query = db_query.filter(professional_profiles::Column::AverageRating.gte(dec));
        }
    }

    let profiles = db_query.all(&ctx.db).await?;
    let mut results = Vec::new();

    for p in profiles {
        if let Some(u) = users::Entity::find().filter(users::Column::Id.eq(p.user_id)).one(&ctx.db).await? {
            results.push(ProfessionalDto {
                id: p.id,
                user_id: p.user_id,
                email: u.email,
                full_name: u.name,
                bio: p.bio,
                years_experience: p.years_experience,
                hourly_rate: p.hourly_rate,
                service_radius_km: p.service_radius_km,
                address: p.address,
                latitude: p.latitude,
                longitude: p.longitude,
                average_rating: p.average_rating,
                total_reviews: p.total_reviews,
                subscription_status: p.subscription_status,
                profile_image: u.profile_image.clone(),
                categories: None,
            });
        }
    }

    format::json(results)
}

#[debug_handler]
async fn list_featured_professionals(
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let featured_items = featured_professionals::Entity::find()
        .order_by_desc(featured_professionals::Column::CreatedAt)
        .limit(6)
        .all(&ctx.db)
        .await?;

    let mut results = Vec::new();

    for feat in featured_items {
        let p_opt = professional_profiles::Entity::find()
            .filter(professional_profiles::Column::Id.eq(feat.professional_profile_id))
            .one(&ctx.db)
            .await?;

        let u_opt = users::Entity::find()
            .filter(users::Column::Id.eq(feat.user_id))
            .one(&ctx.db)
            .await?;

        if let (Some(p), Some(u)) = (p_opt, u_opt) {
            results.push(ProfessionalDto {
                id: p.id,
                user_id: u.id,
                email: u.email,
                full_name: u.name,
                bio: p.bio,
                years_experience: p.years_experience,
                hourly_rate: p.hourly_rate,
                service_radius_km: p.service_radius_km,
                address: p.address,
                latitude: p.latitude,
                longitude: p.longitude,
                average_rating: p.average_rating,
                total_reviews: p.total_reviews,
                subscription_status: p.subscription_status,
                profile_image: u.profile_image.clone(),
                categories: None,
            });
        }
    }

    if results.is_empty() {
        let profiles = professional_profiles::Entity::find()
            .filter(professional_profiles::Column::SubscriptionStatus.is_in(vec![
                "ACTIVE".to_string(), "active".to_string(), "TRIALING".to_string(), "trialing".to_string()
            ]))
            .order_by_desc(professional_profiles::Column::AverageRating)
            .order_by_desc(professional_profiles::Column::TotalReviews)
            .limit(6)
            .all(&ctx.db)
            .await?;

        for p in profiles {
            if let Some(u) = users::Entity::find().filter(users::Column::Id.eq(p.user_id)).one(&ctx.db).await? {
                results.push(ProfessionalDto {
                    id: p.id,
                    user_id: u.id,
                    email: u.email,
                    full_name: u.name,
                    bio: p.bio,
                    years_experience: p.years_experience,
                    hourly_rate: p.hourly_rate,
                    service_radius_km: p.service_radius_km,
                    address: p.address,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    average_rating: p.average_rating,
                    total_reviews: p.total_reviews,
                    subscription_status: p.subscription_status,
                    profile_image: u.profile_image.clone(),
                    categories: None,
                });
            }
        }
    }

    format::json(results)
}

#[debug_handler]
async fn me(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user_id = uuid::Uuid::parse_str(&auth.claims.pid).map_err(|e| Error::BadRequest(e.to_string()))?;

    let p = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let u = users::Entity::find()
        .filter(users::Column::Id.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let cats = professional_profile_categories::Entity::find()
        .filter(professional_profile_categories::Column::ProfessionalProfileId.eq(p.id))
        .all(&ctx.db)
        .await?;
    let category_ids: Vec<String> = cats.into_iter().map(|c| c.service_category_id).collect();

    format::json(ProfessionalDto {
        id: p.id,
        user_id: p.user_id,
        email: u.email,
        full_name: u.name,
        bio: p.bio,
        years_experience: p.years_experience,
        hourly_rate: p.hourly_rate,
        service_radius_km: p.service_radius_km,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        average_rating: p.average_rating,
        total_reviews: p.total_reviews,
        subscription_status: p.subscription_status,
        profile_image: u.profile_image.clone(),
        categories: Some(category_ids),
    })
}

#[debug_handler]
async fn update_me(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<UpdateProfessionalDto>,
) -> Result<Response> {
    let user_id = uuid::Uuid::parse_str(&auth.claims.pid).map_err(|e| Error::BadRequest(e.to_string()))?;
    let now: sea_orm::prelude::DateTimeWithTimeZone = chrono::Utc::now().into();

    let p = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let u = users::Entity::find()
        .filter(users::Column::Id.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    if let Some(name) = params.full_name {
        let mut active_u: users::ActiveModel = u.clone().into();
        active_u.name = Set(name);
        active_u.updated_at = Set(now);
        active_u.update(&ctx.db).await?;
    }

    let mut active_p: professional_profiles::ActiveModel = p.clone().into();
    if let Some(bio) = params.bio {
        active_p.bio = Set(Some(bio));
    }
    if let Some(exp) = params.years_experience {
        active_p.years_experience = Set(exp);
    }
    if let Some(rate) = params.hourly_rate {
        active_p.hourly_rate = Set(rate);
    }
    if let Some(radius) = params.service_radius_km {
        active_p.service_radius_km = Set(radius);
    }
    if let Some(addr) = params.address {
        active_p.address = Set(Some(addr));
    }
    if let Some(lat) = params.latitude {
        active_p.latitude = Set(Some(lat));
    }
    if let Some(lng) = params.longitude {
        active_p.longitude = Set(Some(lng));
    }
    active_p.updated_at = Set(now);
    let updated_p = active_p.update(&ctx.db).await?;

    if let Some(cats) = params.categories {
        professional_profile_categories::Entity::delete_many()
            .filter(professional_profile_categories::Column::ProfessionalProfileId.eq(p.id))
            .exec(&ctx.db)
            .await?;

        for cat_id in cats {
            let new_cat = professional_profile_categories::ActiveModel {
                id: Set(uuid::Uuid::new_v4()),
                professional_profile_id: Set(p.id),
                service_category_id: Set(cat_id),
                created_at: Set(now),
                updated_at: Set(now),
            };
            new_cat.insert(&ctx.db).await?;
        }
    }

    let updated_u = users::Entity::find()
        .filter(users::Column::Id.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let final_cats = professional_profile_categories::Entity::find()
        .filter(professional_profile_categories::Column::ProfessionalProfileId.eq(p.id))
        .all(&ctx.db)
        .await?;
    let final_category_ids: Vec<String> = final_cats.into_iter().map(|c| c.service_category_id).collect();

    format::json(ProfessionalDto {
        id: updated_p.id,
        user_id: updated_p.user_id,
        email: updated_u.email,
        full_name: updated_u.name,
        bio: updated_p.bio,
        years_experience: updated_p.years_experience,
        hourly_rate: updated_p.hourly_rate,
        service_radius_km: updated_p.service_radius_km,
        address: updated_p.address,
        latitude: updated_p.latitude,
        longitude: updated_p.longitude,
        average_rating: updated_p.average_rating,
        total_reviews: updated_p.total_reviews,
        subscription_status: updated_p.subscription_status,
        profile_image: updated_u.profile_image.clone(),
        categories: Some(final_category_ids),
    })
}

#[debug_handler]
async fn my_reviews(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user_id = uuid::Uuid::parse_str(&auth.claims.pid).map_err(|e| Error::BadRequest(e.to_string()))?;

    let p = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let r_list = reviews::Entity::find()
        .filter(reviews::Column::ProfessionalProfileId.eq(p.id))
        .order_by_desc(reviews::Column::CreatedAt)
        .all(&ctx.db)
        .await?;

    let mut results = Vec::new();

    for r in r_list {
        let client_name = if let Some(u) = users::Entity::find().filter(users::Column::Id.eq(r.client_id)).one(&ctx.db).await? {
            u.name
        } else {
            "Cliente Agiliza".to_string()
        };

        results.push(serde_json::json!({
            "id": r.id,
            "client_name": client_name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at
        }));
    }

    format::json(results)
}

#[debug_handler]
async fn get_limits(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user_id = uuid::Uuid::parse_str(&auth.claims.pid).map_err(|e| Error::BadRequest(e.to_string()))?;

    let p = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::NotFound)?;

    let plan = crate::models::_entities::subscription_plans::Entity::find_by_id(&p.subscription_plan)
        .one(&ctx.db)
        .await?;
    let limit = plan.map(|pl| pl.monthly_unlock_limit as u64).unwrap_or(5);

    let now = chrono::Utc::now();
    let start_of_month = chrono::NaiveDate::from_ymd_opt(now.date_naive().year(), now.date_naive().month(), 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();

    let count = crate::models::_entities::unlocked_contacts::Entity::find()
        .filter(crate::models::_entities::unlocked_contacts::Column::ProfessionalProfileId.eq(p.id))
        .filter(crate::models::_entities::unlocked_contacts::Column::CreatedAt.gte(start_of_month))
        .count(&ctx.db)
        .await?;

    format::json(serde_json::json!({
        "plan": p.subscription_plan,
        "limit": limit,
        "used": count,
        "remaining": if limit > count { limit - count } else { 0 },
        "is_unlimited": limit == 99999
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth/professionals")
        .add("/", get(list_professionals))
        .add("/featured", get(list_featured_professionals))
        .add("/me", get(me).put(update_me))
        .add("/me/reviews", get(my_reviews))
        .add("/me/limits", get(get_limits))
}
