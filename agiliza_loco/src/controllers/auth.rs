use crate::{
    mailers::auth::AuthMailer,
    models::{
        _entities::users,
        users::{LoginParams, RegisterParams},
    },
    views::auth::{CurrentResponse, LoginResponse},
};
use loco_rs::prelude::*;
use regex::Regex;
use sea_orm::ActiveModelTrait;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

pub static EMAIL_DOMAIN_RE: OnceLock<Regex> = OnceLock::new();

fn get_allow_email_domain_re() -> &'static Regex {
    EMAIL_DOMAIN_RE.get_or_init(|| {
        Regex::new(r"@example\.com$|@gmail\.com$").expect("Failed to compile regex")
    })
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UserProfileDto {
    pub id: uuid::Uuid,
    pub email: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub cpf: Option<String>,
    pub role: String,
    pub is_verified: bool,
    pub date_joined: String,
}

impl UserProfileDto {
    pub fn from_user(user: &users::Model) -> Self {
        Self {
            id: user.id,
            email: user.email.clone(),
            full_name: user.name.clone(),
            phone: user.phone.clone(),
            cpf: user.cpf.clone(),
            role: user.role.clone().unwrap_or_else(|| "CLIENT".to_string()),
            is_verified: user.is_verified.unwrap_or(false),
            date_joined: user.created_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TokensDto {
    pub access: String,
    pub refresh: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AuthResponseDto {
    pub message: String,
    pub user: UserProfileDto,
    pub tokens: TokensDto,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ProfileUpdateParams {
    pub full_name: Option<String>,
    pub phone: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RefreshTokenParams {
    pub refresh: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LogoutParams {
    pub refresh: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ForgotParams {
    pub email: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ResetParams {
    pub token: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MagicLinkParams {
    pub email: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ResendVerificationParams {
    pub email: String,
}

#[debug_handler]
async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> Result<Response> {
    if let Some(ref confirm) = params.password_confirm {
        if confirm != &params.password {
            return bad_request("Passwords do not match");
        }
    }

    let user = match users::Model::create_with_password(&ctx.db, &params).await {
        Ok(user) => user,
        Err(err) => {
            tracing::info!(
                message = err.to_string(),
                user_email = &params.email,
                "could not register user",
            );
            return format::json(());
        }
    };

    let jwt_secret = ctx.config.get_jwt_config()?;
    let access_token = user.generate_jwt(&jwt_secret.secret, jwt_secret.expiration)?;
    let refresh_token = user.generate_jwt(&jwt_secret.secret, jwt_secret.expiration * 7)?;

    let user = user
        .into_active_model()
        .set_email_verification_sent(&ctx.db)
        .await?;

    let _ = AuthMailer::send_welcome(&ctx, &user).await;

    format::json(AuthResponseDto {
        message: "User registered successfully.".to_string(),
        user: UserProfileDto::from_user(&user),
        tokens: TokensDto {
            access: access_token,
            refresh: refresh_token,
        },
    })
}

#[debug_handler]
async fn login(
    State(ctx): State<AppContext>,
    Json(params): Json<LoginParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        return unauthorized("Invalid credentials!");
    };

    if !user.verify_password(&params.password) {
        return unauthorized("unauthorized!");
    }

    if user.is_blocked.unwrap_or(false) {
        let reason = user.blocked_reason.as_deref().unwrap_or("Sua conta foi suspensa temporariamente por violação dos termos.");
        return Err(Error::Unauthorized(format!("Conta Bloqueada: {}", reason)));
    }

    let jwt_secret = ctx.config.get_jwt_config()?;
    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    format::json(LoginResponse::new(&user, &token))
}

#[debug_handler]
async fn current(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    format::json(CurrentResponse::new(&user))
}

#[debug_handler]
async fn verify(State(ctx): State<AppContext>, Path(token): Path<String>) -> Result<Response> {
    let Ok(user) = users::Model::find_by_verification_token(&ctx.db, &token).await else {
        return unauthorized("invalid token");
    };

    if user.email_verified_at.is_some() {
        tracing::info!(pid = user.id.to_string(), "user already verified");
    } else {
        let active_model = user.into_active_model();
        let user = active_model.verified(&ctx.db).await?;
        tracing::info!(pid = user.id.to_string(), "user verified");
    }

    format::json(())
}

#[debug_handler]
async fn forgot(
    State(ctx): State<AppContext>,
    Json(params): Json<ForgotParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        return format::json(());
    };

    let user = user
        .into_active_model()
        .set_forgot_password_sent(&ctx.db)
        .await?;

    let _ = AuthMailer::forgot_password(&ctx, &user).await;

    format::json(())
}

#[debug_handler]
async fn reset(State(ctx): State<AppContext>, Json(params): Json<ResetParams>) -> Result<Response> {
    let Ok(user) = users::Model::find_by_reset_token(&ctx.db, &params.token).await else {
        return format::json(());
    };
    user.into_active_model()
        .reset_password(&ctx.db, &params.password)
        .await?;

    format::json(())
}

#[debug_handler]
async fn magic_link(
    State(ctx): State<AppContext>,
    Json(params): Json<MagicLinkParams>,
) -> Result<Response> {
    let email_regex = get_allow_email_domain_re();
    if !email_regex.is_match(&params.email) {
        return bad_request("invalid request");
    }

    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        return format::empty_json();
    };

    let user = user.into_active_model().create_magic_link(&ctx.db).await?;
    let _ = AuthMailer::send_magic_link(&ctx, &user).await;

    format::empty_json()
}

#[debug_handler]
async fn magic_link_verify(
    Path(token): Path<String>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_magic_token(&ctx.db, &token).await else {
        return unauthorized("unauthorized!");
    };

    let user = user.into_active_model().clear_magic_link(&ctx.db).await?;
    let jwt_secret = ctx.config.get_jwt_config()?;
    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    format::json(LoginResponse::new(&user, &token))
}

#[debug_handler]
async fn resend_verification_email(
    State(ctx): State<AppContext>,
    Json(params): Json<ResendVerificationParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        return format::json(());
    };

    if user.email_verified_at.is_some() {
        return format::json(());
    }

    let user = user
        .into_active_model()
        .set_email_verification_sent(&ctx.db)
        .await?;

    let _ = AuthMailer::send_welcome(&ctx, &user).await;

    format::json(())
}

#[debug_handler]
async fn get_profile(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    format::json(UserProfileDto::from_user(&user))
}

#[debug_handler]
async fn update_profile(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<ProfileUpdateParams>,
) -> Result<Response> {
    let user = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await?;
    let mut active: users::ActiveModel = user.into();

    if let Some(name) = params.full_name {
        active.name = Set(name);
    }
    if let Some(phone) = params.phone {
        active.phone = Set(Some(phone));
    }

    let updated = active.update(&ctx.db).await?;
    format::json(serde_json::json!({
        "message": "Profile updated successfully.",
        "user": UserProfileDto::from_user(&updated)
    }))
}

#[debug_handler]
async fn logout(
    State(_ctx): State<AppContext>,
    _auth: auth::JWT,
    Json(_params): Json<LogoutParams>,
) -> Result<Response> {
    format::json(serde_json::json!({
        "message": "Logout successful."
    }))
}

#[debug_handler]
async fn refresh_token(
    State(ctx): State<AppContext>,
    Json(params): Json<RefreshTokenParams>,
) -> Result<Response> {
    let jwt_secret = ctx.config.get_jwt_config()?;
    let token_data = loco_rs::auth::jwt::JWT::new(&jwt_secret.secret)
        .validate(&params.refresh)
        .or_else(|_| unauthorized("Invalid or expired refresh token"))?;

    let user = users::Model::find_by_id(&ctx.db, &token_data.claims.pid).await?;
    let new_access = user.generate_jwt(&jwt_secret.secret, jwt_secret.expiration)?;

    format::json(serde_json::json!({
        "access": new_access
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/register", post(register))
        .add("/verify/{token}", get(verify))
        .add("/login", post(login))
        .add("/forgot", post(forgot))
        .add("/reset", post(reset))
        .add("/current", get(current))
        .add("/magic-link", post(magic_link))
        .add("/magic-link/{token}", get(magic_link_verify))
        .add("/resend-verification-mail", post(resend_verification_email))
        .add("/profile", get(get_profile).put(update_profile).patch(update_profile))
        .add("/logout", post(logout))
        .add("/token/refresh", post(refresh_token))
}
