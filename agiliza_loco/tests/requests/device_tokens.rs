use agiliza_loco::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;
use agiliza_loco::models::_entities::users;

#[tokio::test]
#[serial]
async fn can_register_device_token() {
    request::<App, _, _>(|request, ctx| async move {
        // Seed users
        seed::<App>(&ctx).await.unwrap();

        // Let's authenticate as a seeded user
        let login_data = super::prepare_data::init_user_login(&request, &ctx).await;
        let token = login_data.token;

        let payload = serde_json::json!({
            "token": "test-fcm-integration-token-123",
            "platform": "android"
        });

        let res = request
            .post("/api/device_tokens/")
            .json(&payload)
            .add_header("Authorization", &format!("Bearer {}", token))
            .await;

        assert_eq!(res.status_code(), 200);
    })
    .await;
}
