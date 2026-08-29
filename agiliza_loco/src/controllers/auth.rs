use crate::mailers::auth::AuthMailer;
use crate::models::{
    _entities::users,
    users::{LoginParams, RegisterParams},
};
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct UserProfileDto {
    pub pid: String,
    pub name: String,
    pub email: String,
    pub role: Option<String>,
    pub is_verified: Option<bool>,
}

impl UserProfileDto {
    pub fn from_user(user: &users::Model) -> Self {
        Self {
            pid: user.id.to_string(),
            name: user.name.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
            is_verified: user.is_verified,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub pid: String,
    pub name: String,
    pub email: String,
    pub role: Option<String>,
    pub is_staff: bool,
    pub is_verified: bool,
}

impl LoginResponse {
    pub fn new(user: &users::Model, token: &str) -> Self {
        Self {
            token: token.to_string(),
            pid: user.id.to_string(),
            name: user.name.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
            is_staff: user.is_staff.unwrap_or(false),
            is_verified: user.is_verified.unwrap_or(false),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CurrentResponse {
    pub pid: String,
    pub name: String,
    pub email: String,
    pub role: Option<String>,
    pub is_verified: Option<bool>,
}

impl CurrentResponse {
    pub fn new(user: &users::Model) -> Self {
        Self {
            pid: user.id.to_string(),
            name: user.name.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
            is_verified: user.is_verified,
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

    let mut clean_params = params;
    clean_params.email = clean_params.email.trim().to_lowercase();

    let user = match users::Model::create_with_password(&ctx.db, &clean_params).await {
        Ok(user) => user,
        Err(err) => {
            tracing::info!(
                message = err.to_string(),
                user_email = &clean_params.email,
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
    let clean_email = params.email.trim().to_lowercase();
    let clean_password = params.password.trim();

    tracing::info!("DEBUG LOGIN TRY: email='{}' password_len={}", clean_email, clean_password.len());

    let Ok(user) = users::Model::find_by_email(&ctx.db, &clean_email).await else {
        tracing::warn!("DEBUG LOGIN FAIL: User not found for email='{}'", clean_email);
        return unauthorized("Invalid credentials!");
    };

    if !user.verify_password(clean_password) {
        tracing::warn!("DEBUG LOGIN FAIL: Password verification failed for user='{}'", clean_email);
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

    tracing::info!("DEBUG LOGIN SUCCESS for user='{}'", clean_email);

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

    user.into_active_model().verified(&ctx.db).await?;
    format::json(())
}

#[debug_handler]
async fn magic_link(
    State(ctx): State<AppContext>,
    Json(params): Json<MagicLinkParams>,
) -> Result<Response> {
    let clean_email = params.email.trim().to_lowercase();
    let Ok(user) = users::Model::find_by_email(&ctx.db, &clean_email).await else {
        return unauthorized("invalid email");
    };

    let user = user.into_active_model().create_magic_link(&ctx.db).await?;
    let _ = AuthMailer::send_magic_link(&ctx, &user).await;

    format::json(())
}

#[debug_handler]
async fn magic_link_verify(
    State(ctx): State<AppContext>,
    Path(token): Path<String>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_magic_token(&ctx.db, &token).await else {
        return unauthorized("invalid token");
    };

    let jwt_secret = ctx.config.get_jwt_config()?;
    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    let res = LoginResponse::new(&user, &token);
    user.into_active_model().clear_magic_link(&ctx.db).await?;

    format::json(res)
}

#[debug_handler]
async fn forgot(
    State(ctx): State<AppContext>,
    Json(params): Json<ForgotParams>,
) -> Result<Response> {
    let clean_email = params.email.trim().to_lowercase();
    let Ok(user) = users::Model::find_by_email(&ctx.db, &clean_email).await else {
        return unauthorized("invalid email");
    };

    let user = user.into_active_model().set_forgot_password_sent(&ctx.db).await?;
    let _ = AuthMailer::forgot_password(&ctx, &user).await;

    format::json(())
}

#[debug_handler]
async fn reset(
    State(ctx): State<AppContext>,
    Json(params): Json<ResetParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_reset_token(&ctx.db, &params.token).await else {
        return unauthorized("invalid token");
    };

    user.into_active_model()
        .reset_password(&ctx.db, &params.password)
        .await?;

    format::json(())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/register", post(register))
        .add("/login", post(login))
        .add("/verify/{token}", get(verify))
        .add("/forgot", post(forgot))
        .add("/reset", post(reset))
        .add("/current", get(current))
        .add("/magic-link", post(magic_link))
        .add("/magic-link/{token}", get(magic_link_verify))
}
