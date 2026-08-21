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
    let user_id = auth.claims.pid.parse::<uuid::Uuid>().unwrap(); // pid is UUID
    let user = crate::models::_entities::users::Entity::find()
        .filter(crate::models::_entities::users::Column::Id.eq(user_id))
        .one(&ctx.db)
        .await?
        .ok_or_else(|| Error::Unauthorized("User not found".to_string()))?;

    let existing = Entity::find()
        .filter(device_tokens::Column::Token.eq(&params.token))
        .one(&ctx.db)
        .await?;

    if let Some(token) = existing {
        if token.user_id != user.id {
            let mut active: ActiveModel = token.into();
            active.user_id = sea_orm::ActiveValue::Set(user.id);
            active.update(&ctx.db).await?;
        }
    } else {
        let active = ActiveModel {
            user_id: sea_orm::ActiveValue::Set(user.id),
            token: sea_orm::ActiveValue::Set(params.token),
            platform: sea_orm::ActiveValue::Set(params.platform),
            is_active: sea_orm::ActiveValue::Set(true),
            ..Default::default()
        };
        active.insert(&ctx.db).await?;
    }

    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/device_tokens")
        .add("/", post(register_token))
}
