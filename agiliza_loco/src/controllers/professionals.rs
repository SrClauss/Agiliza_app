use crate::models::{
    _entities::{professional_profiles, users},
    professional_profiles::Model as ProfModel,
};
use loco_rs::prelude::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder, PaginatorTrait};
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
}

#[debug_handler]
async fn list_professionals(
    _auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(query): Query<SearchQueryParams>,
) -> Result<Response> {
    let mut db_query = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::SubscriptionStatus.is_in(vec!["active".to_string(), "trialing".to_string()]))
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

    let search_lat = query.latitude.or(query.lat);
    let search_lng = query.longitude.or(query.lng).or(query.lon);

    for p in profiles {
        let user = users::Entity::find_by_id(p.user_id)
            .one(&ctx.db)
            .await?
            .ok_or_else(|| ModelError::EntityNotFound)?;

        if let (Some(lat), Some(lng), Some(radius)) = (search_lat, search_lng, query.radius_km) {
            if let (Some(plat), Some(plng)) = (p.latitude, p.longitude) {
                use rust_decimal::prelude::ToPrimitive;
                let plat_f64 = plat.to_f64().unwrap_or(0.0);
                let plng_f64 = plng.to_f64().unwrap_or(0.0);
                let dist = ProfModel::distance_km(lat, lng, plat_f64, plng_f64);
                if dist > radius {
                    continue;
                }
            } else {
                continue;
            }
        }

        results.push(ProfessionalDto {
            id: p.id,
            user_id: user.id,
            email: user.email,
            full_name: user.name,
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
        });
    }

    format::json(results)
}

#[debug_handler]
async fn me(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    if user.role.as_deref() != Some("PROFESSIONAL") {
        return unauthorized("Only professional users may access this endpoint.");
    }

    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    match prof {
        Some(p) => format::json(ProfessionalDto {
            id: p.id,
            user_id: user.id,
            email: user.email,
            full_name: user.name,
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
        }),
        None => not_found(),
    }
}

#[debug_handler]
async fn get_limits(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    let Some(p) = prof else {
        return unauthorized("Only professionals have limits.");
    };

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

    use sea_orm::QuerySelect;
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
        .add("/me", get(me))
        .add("/me/limits", get(get_limits))
}
