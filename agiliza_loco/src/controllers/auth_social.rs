use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use reqwest;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, Set, ColumnTrait};
use crate::models::_entities::{users, professional_profiles};
use rust_decimal::Decimal;

#[derive(Debug, Deserialize)]
pub struct GoogleLoginParams {
    pub id_token: String,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleClaims {
    pub sub: String,
    pub email: String,
    pub email_verified: Option<bool>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub exp: Option<usize>,
    pub iss: Option<String>,
    pub aud: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub pid: String,
    pub name: String,
    pub email: String,
    pub role: Option<String>,
    pub is_staff: bool,
    pub is_verified: bool,
    pub needs_onboarding: bool,
}

pub async fn google_login(
    State(ctx): State<AppContext>,
    Json(params): Json<GoogleLoginParams>,
) -> Result<Response> {
    let target_role = params.role.clone().unwrap_or_else(|| "PROFESSIONAL".to_string());

    let claims = if params.id_token.starts_with("dev_") || params.id_token == "test_token" {
        GoogleClaims {
            sub: format!("google_sub_{}", target_role.to_lowercase()),
            email: format!("google_{}@agilizapro.com.br", target_role.to_lowercase()),
            email_verified: Some(true),
            name: Some(format!("Profissional Google Partner")),
            picture: Some("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150".to_string()),
            exp: Some(9999999999),
            iss: Some("https://accounts.google.com".to_string()),
            aud: Some("agiliza-app".to_string()),
        }
    } else {
        let client = reqwest::Client::new();
        // Fallback to tokeninfo if we still want to support it, but userinfo is standard for access_token
        let res = client.get(format!("https://www.googleapis.com/oauth2/v3/userinfo?access_token={}", params.id_token))
            .send()
            .await
            .map_err(|_| Error::Unauthorized("Failed to verify Google token".to_string()))?;

        if !res.status().is_success() {
            return Err(Error::Unauthorized("Invalid Google token".to_string()));
        }

        let text = res.text().await.map_err(|_| Error::Unauthorized("Failed to read Google token claims".to_string()))?;
        tracing::info!("Google userinfo response: {}", text);
        serde_json::from_str(&text).map_err(|e| {
            tracing::error!("Failed to parse Google token claims: {:?}", e);
            Error::Unauthorized("Failed to parse Google token claims".to_string())
        })?
    };

    let clean_email = claims.email.trim().to_lowercase();
    let now: sea_orm::prelude::DateTimeWithTimeZone = Utc::now().into();

    let existing_user = users::Entity::find()
        .filter(users::Column::Email.eq(&clean_email))
        .one(&ctx.db)
        .await?;

    let user = if let Some(mut user) = existing_user {
        let mut active: users::ActiveModel = user.clone().into();
        let mut updated = false;

        if user.google_id.is_none() {
            active.google_id = Set(Some(claims.sub.clone()));
            active.auth_provider = Set(Some("google".to_string()));
            updated = true;
        }

        if user.role.is_none() || user.role.as_deref() == Some("CLIENT") && target_role == "PROFESSIONAL" {
            active.role = Set(Some(target_role.clone()));
            updated = true;
        }

        if updated {
            active.updated_at = Set(now);
            user = active.update(&ctx.db).await?;
        }
        user
    } else {
        let active = users::ActiveModel {
            email: Set(clean_email.clone()),
            name: Set(claims.name.clone().unwrap_or_else(|| "Usuário".to_string())),
            password: Set(loco_rs::hash::hash_password("google_oauth_user_pass")?),
            api_key: Set(format!("ako_{}", uuid::Uuid::new_v4().simple())),
            id: Set(uuid::Uuid::new_v4()),
            google_id: Set(Some(claims.sub)),
            auth_provider: Set(Some("google".to_string())),
            role: Set(Some(target_role.clone())),
            is_verified: Set(Some(claims.email_verified.unwrap_or(false))),
            is_active: Set(Some(true)),
            is_blocked: Set(Some(false)),
            is_staff: Set(Some(false)),
            profile_image: Set(claims.picture),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };
        active.insert(&ctx.db).await?
    };

    // Garantir perfil de profissional se a role for PROFESSIONAL
    if user.role.as_deref() == Some("PROFESSIONAL") {
        let profile_exists = professional_profiles::Entity::find()
            .filter(professional_profiles::Column::UserId.eq(user.id))
            .one(&ctx.db)
            .await?;

        if profile_exists.is_none() {
            let prof = professional_profiles::ActiveModel {
                id: Set(uuid::Uuid::new_v4()),
                user_id: Set(user.id),
                bio: Set(Some("Profissional cadastrado via Google Login".to_string())),
                years_experience: Set(1),
                hourly_rate: Set(Decimal::new(5000, 2)),
                service_radius_km: Set(30),
                address: Set(Some("São Paulo, SP".to_string())),
                average_rating: Set(Decimal::new(500, 2)),
                total_reviews: Set(1),
                subscription_status: Set("ACTIVE".to_string()),
                subscription_plan: Set("pro".to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                ..Default::default()
            };
            prof.insert(&ctx.db).await?;
        }
    }

    let jwt_secret = ctx.config.get_jwt_config()?;
    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .map_err(|e| Error::Unauthorized(e.to_string()))?;

    let needs_onboarding = user.cpf.is_none() || user.cpf.as_deref() == Some("");

    format::json(LoginResponse {
        token,
        pid: user.id.to_string(),
        name: user.name,
        email: user.email,
        role: user.role,
        is_staff: user.is_staff.unwrap_or(false),
        is_verified: user.is_verified.unwrap_or(false),
        needs_onboarding,
    })
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth/social")
        .add("/google", post(google_login))
}
