use agiliza_loco::{
    app::App,
    models::_entities::service_categories::ActiveModel,
};
use loco_rs::testing::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue};
use serial_test::serial;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("service_categories");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create_service_category() {
    configure_insta!();
    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let category = ActiveModel {
        id: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        name: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        slug: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        icon: ActiveValue::Set(Some("wrench".to_string())),
        description: ActiveValue::Set(Some("Fix pipes".to_string())),
        is_active: ActiveValue::Set(true),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await;

    assert!(category.is_ok(), "{:?}", category.err());
}
