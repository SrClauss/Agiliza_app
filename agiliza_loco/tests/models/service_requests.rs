use agiliza_loco::{
    app::App,
    models::{
        _entities::service_requests::ActiveModel,
        service_requests::{self, Model},
        users, professional_profiles, service_categories
    },
};
use loco_rs::testing::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serial_test::serial;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("service_requests");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create_service_request() {
    configure_insta!();
    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let user = users::ActiveModel {
        email: ActiveValue::Set("client@example.com".to_string()),
        password: ActiveValue::Set("hashed_pass".to_string()),
        name: ActiveValue::Set("Client Name".to_string()),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        api_key: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        role: ActiveValue::Set(Some("CLIENT".to_string())),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    let category = service_categories::ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        name: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        slug: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        is_active: ActiveValue::Set(true),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    let request = ActiveModel {
        client_id: ActiveValue::Set(user.id),
        service_category_id: ActiveValue::Set(Some(category.id)),
        title: ActiveValue::Set("Need cleaning".to_string()),
        description: ActiveValue::Set("Deep cleaning".to_string()),
        status: ActiveValue::Set("OPEN".to_string()),
        latitude: ActiveValue::Set(Some(rust_decimal::Decimal::new(-235505, 4))),
        longitude: ActiveValue::Set(Some(rust_decimal::Decimal::new(-466333, 4))),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await;

    assert!(request.is_ok(), "{:?}", request.err());
}
