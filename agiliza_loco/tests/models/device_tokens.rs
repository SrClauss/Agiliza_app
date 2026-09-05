use agiliza_loco::{
    app::App,
    models::{
        _entities::device_tokens::ActiveModel,
        device_tokens::{self, Model},
        users
    },
};
use loco_rs::testing::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serial_test::serial;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("device_tokens");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create_device_token() {
    configure_insta!();
    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let user = users::ActiveModel {
        email: ActiveValue::Set("device_user@example.com".to_string()),
        password: ActiveValue::Set("hashed_pass".to_string()),
        name: ActiveValue::Set("Device User".to_string()),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        api_key: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    let token = ActiveModel {
        user_id: ActiveValue::Set(user.id),
        token: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        platform: ActiveValue::Set("android".to_string()),
        is_active: ActiveValue::Set(true),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await;

    assert!(token.is_ok(), "{:?}", token.err());
}
