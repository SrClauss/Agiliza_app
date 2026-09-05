use agiliza_loco::{
    app::App,
    models::{
        _entities::professional_profiles::ActiveModel,
        users,
        professional_profiles::{self, Model},
    },
};
use loco_rs::testing::prelude::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serial_test::serial;

macro_rules! configure_insta {
    ($($expr:expr),*) => {
        let mut settings = insta::Settings::clone_current();
        settings.set_prepend_module_to_snapshot(false);
        settings.set_snapshot_suffix("professional_profiles");
        let _guard = settings.bind_to_scope();
    };
}

#[tokio::test]
#[serial]
async fn test_create_professional_profile() {
    configure_insta!();
    let boot = boot_test::<App>().await.unwrap();

    let user = users::ActiveModel {
        email: ActiveValue::Set("prof@example.com".to_string()),
        password: ActiveValue::Set("hashed_pass".to_string()),
        name: ActiveValue::Set("Prof Name".to_string()),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        api_key: ActiveValue::Set("api-key-test".to_string()),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    let profile = ActiveModel {
        user_id: ActiveValue::Set(user.id),
        years_experience: ActiveValue::Set(5),
        hourly_rate: ActiveValue::Set(rust_decimal::Decimal::new(5000, 2)),
        service_radius_km: ActiveValue::Set(20),
        average_rating: ActiveValue::Set(rust_decimal::Decimal::new(0, 0)),
        total_reviews: ActiveValue::Set(0),
        bio: ActiveValue::Set(Some("My bio".to_string())),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await;

    assert!(profile.is_ok(), "{:?}", profile.err());
}

#[tokio::test]
#[serial]
async fn test_find_or_create_for_user() {
    configure_insta!();
    let boot = boot_test::<App>().await.unwrap();
    seed::<App>(&boot.app_context).await.unwrap();

    let user = users::ActiveModel {
        email: ActiveValue::Set("prof2@example.com".to_string()),
        password: ActiveValue::Set("hashed".to_string()),
        name: ActiveValue::Set("Prof 2".to_string()),
        id: ActiveValue::Set(uuid::Uuid::new_v4()),
        api_key: ActiveValue::Set(uuid::Uuid::new_v4().to_string()),
        ..Default::default()
    }
    .insert(&boot.app_context.db)
    .await
    .unwrap();

    // First call: creates profile
    let profile1 = professional_profiles::find_or_create_for_user(&boot.app_context.db, user.id).await.unwrap();
    assert_eq!(profile1.user_id, user.id);
    assert_eq!(profile1.years_experience, 0);

    // Second call: finds existing profile
    let profile2 = professional_profiles::find_or_create_for_user(&boot.app_context.db, user.id).await.unwrap();
    assert_eq!(profile2.id, profile1.id);
}

#[test]
fn test_distance_km() {
    // Distance between NY and London is ~5570 km
    let lat1 = 40.7128;
    let lon1 = -74.0060;
    let lat2 = 51.5074;
    let lon2 = -0.1278;

    let distance = Model::distance_km(lat1, lon1, lat2, lon2);
    
    // allow small margin of error due to earth radius approximation
    assert!(distance > 5500.0 && distance < 5650.0, "Calculated distance: {}", distance);
}
