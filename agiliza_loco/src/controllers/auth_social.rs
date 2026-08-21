use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use reqwest;

use crate::models::_entities::users;

#[derive(Debug, Deserialize)]
pub struct GoogleLoginParams {
    pub id_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleClaims {
    pub sub: String,
    pub email: String,
    pub email_verified: bool,
    pub name: String,
    pub picture: Option<String>,
    pub exp: usize,
    pub iss: String,
    pub aud: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub pid: String,
    pub name: String,
}

pub async fn google_login(
    State(ctx): State<AppContext>,
    Json(params): Json<GoogleLoginParams>,
) -> Result<Response> {
    let client = reqwest::Client::new();
    let res = client.get(format!("https://oauth2.googleapis.com/tokeninfo?id_token={}", params.id_token))
        .send()
        .await
        .map_err(|_| Error::Unauthorized("Failed to verify token".to_string()))?;

    if !res.status().is_success() {
        return Err(Error::Unauthorized("Invalid token".to_string()));
    }

    let claims: GoogleClaims = res.json().await
        .map_err(|_| Error::Unauthorized("Failed to parse token info".to_string()))?;

    let existing_user = users::Entity::find()
        .filter(users::Column::Email.eq(&claims.email))
        .one(&ctx.db)
        .await?;

    let user = if let Some(mut user) = existing_user {
        if user.google_id.is_none() {
            let mut active: users::ActiveModel = user.into();
            active.google_id = sea_orm::ActiveValue::Set(Some(claims.sub.clone()));
            active.auth_provider = sea_orm::ActiveValue::Set(Some("google".to_string()));
            user = active.update(&ctx.db).await?;
        }
        user
    } else {
        let active = users::ActiveModel {
            email: sea_orm::ActiveValue::Set(claims.email.clone()),
            name: sea_orm::ActiveValue::Set(claims.name.clone()),
            password: sea_orm::ActiveValue::Set("social_login_dummy_password".to_string()),
            api_key: sea_orm::ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
            id: sea_orm::ActiveValue::Set(uuid::Uuid::new_v4()),
            google_id: sea_orm::ActiveValue::Set(Some(claims.sub)),
            auth_provider: sea_orm::ActiveValue::Set(Some("google".to_string())),
            is_verified: sea_orm::ActiveValue::Set(Some(claims.email_verified)),
            ..Default::default()
        };
        active.insert(&ctx.db).await?
    };

    let jwt_secret = ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().secret.clone();
    let expiration = ctx.config.auth.as_ref().unwrap().jwt.as_ref().unwrap().expiration;
    let token = loco_rs::auth::jwt::JWT::new(&jwt_secret)
        .generate_token(
            expiration,
            user.id.to_string(),
            serde_json::Map::new(),
        )
        .map_err(|e| Error::Unauthorized(e.to_string()))?;

    format::json(LoginResponse {
        token,
        pid: user.id.to_string(),
        name: user.name,
    })
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/auth/social")
        .add("/google", post(google_login))
}
