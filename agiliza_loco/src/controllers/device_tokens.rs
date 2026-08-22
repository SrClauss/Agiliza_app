use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::_entities::device_tokens::{self, ActiveModel, Entity};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceTokenParams {
    pub token: String,
    pub platform: String,
}

pub async fn register_token(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<DeviceTokenParams>,
) -> Result<Response> {
    let user_id = match auth.claims.pid.parse::<uuid::Uuid>() {
        Ok(uid) => uid,
        Err(_) => return Err(Error::Unauthorized("Invalid user ID".to_string())),
    };

    let existing = Entity::find()
        .filter(device_tokens::Column::Token.eq(&params.token))
        .one(&ctx.db)
        .await?;

    if let Some(token) = existing {
        let mut active: ActiveModel = token.into();
        active.user_id = sea_orm::ActiveValue::Set(user_id);
        active.is_active = sea_orm::ActiveValue::Set(true);
        active.update(&ctx.db).await?;
    } else {
        let active = ActiveModel {
            id: sea_orm::ActiveValue::Set(uuid::Uuid::new_v4()),
            user_id: sea_orm::ActiveValue::Set(user_id),
            token: sea_orm::ActiveValue::Set(params.token),
            platform: sea_orm::ActiveValue::Set(params.platform),
            is_active: sea_orm::ActiveValue::Set(true),
            created_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
        };
        active.insert(&ctx.db).await?;
    }

    format::json(serde_json::json!({ "status": "registered" }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/device_tokens")
        .add("/", post(register_token))
}
