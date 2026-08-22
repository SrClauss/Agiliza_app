use web_push::*;
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter};
use loco_rs::prelude::*;
use crate::models::_entities::device_tokens;

pub const VAPID_PUBLIC_KEY: &str = "BG_46KFeyhhEnxywfpu0KzpwUYn6aOzTti3dmkE9qmq21A3WDeA6LbZzW77dsHNHm_pykaOS9H4keOEWM05MgMo";
pub const VAPID_PRIVATE_KEY: &str = "kUHD6yKesigM3q9H1w8fYonlcFpPlJ5v6eQbtXYCHpw";

pub async fn send_web_push(db: &DatabaseConnection, user_id: uuid::Uuid, title: &str, body: &str, url: &str) {
    let tokens = match device_tokens::Entity::find()
        .filter(device_tokens::Column::UserId.eq(user_id))
        .filter(device_tokens::Column::IsActive.eq(true))
        .all(db)
        .await
    {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("[WebPush Error] Erro ao buscar tokens do usuario {}: {:?}", user_id, e);
            return;
        }
    };

    if tokens.is_empty() {
        tracing::warn!("[WebPush] Nenhum device_token ativo encontrado para o usuario {}", user_id);
        return;
    }

    let payload = serde_json::json!({
        "title": title,
        "body": body,
        "url": url
    }).to_string();

    let client = match IsahcWebPushClient::new() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("[WebPush Error] Falha ao instanciar IsahcWebPushClient: {:?}", e);
            return;
        }
    };

    for t in tokens {
        if let Ok(sub_info) = serde_json::from_str::<SubscriptionInfo>(&t.token) {
            let mut builder = WebPushMessageBuilder::new(&sub_info);
            builder.set_payload(ContentEncoding::Aes128Gcm, payload.as_bytes());

            match VapidSignatureBuilder::from_base64(
                VAPID_PRIVATE_KEY,
                URL_SAFE_NO_PAD,
                &sub_info,
            ) {
                Ok(sig_builder) => {
                    if let Ok(sig) = sig_builder.build() {
                        builder.set_vapid_signature(sig);
                        if let Ok(message) = builder.build() {
                            match client.send(message).await {
                                Ok(_) => tracing::info!("[WebPush Success] Notificacao push enviada com sucesso para usuario {}", user_id),
                                Err(err) => tracing::error!("[WebPush Error] Erro ao despachar notificacao via FCM/WebPush: {:?}", err),
                            }
                        }
                    }
                }
                Err(err) => {
                    tracing::error!("[WebPush Error] Erro ao assinar VAPID: {:?}", err);
                }
            }
        }
    }
}
