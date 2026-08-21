use agiliza_loco::{
    app::App,
    models::_entities::{
        portfolio_items::ActiveModel,
        users, professional_profiles,
    },
};
use loco_rs::testing::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serial_test::serial;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("portfolio_items");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create_portfolio_item() {
    configure_insta!();
    let boot = boot_test::<App>().await.unwrap();

    let prof_user = users::ActiveModel {
        email: ActiveValue::Set("prof_pt@example.com".to_string()),
        password: ActiveValue::Set("hashed".to_string()),
        name: ActiveValue::Set("Prof".to_string()),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        api_key: ActiveValue::Set("api-key-prof-pt".to_string()),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    let prof = professional_profiles::ActiveModel {
        user_id: ActiveValue::Set(prof_user.id),
        years_experience: ActiveValue::Set(5),
        hourly_rate: ActiveValue::Set(rust_decimal::Decimal::new(5000, 2)),
        service_radius_km: ActiveValue::Set(20),
        average_rating: ActiveValue::Set(rust_decimal::Decimal::new(0, 0)),
        total_reviews: ActiveValue::Set(0),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    let item = ActiveModel {
        professional_profile_id: ActiveValue::Set(prof.id),
        title: ActiveValue::Set("Nice job".to_string()),
        description: ActiveValue::Set(Some("Did this nice job".to_string())),
        image: ActiveValue::Set(Some("http://example.com/img.png".to_string())),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await;

    assert!(item.is_ok(), "{:?}", item.err());
}
