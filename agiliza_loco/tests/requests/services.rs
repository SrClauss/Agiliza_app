use agiliza_loco::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

use super::prepare_data;

#[tokio::test]
#[serial]
async fn can_list_categories() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.get("/api/categories/").await;
        assert_eq!(response.status_code(), 200);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_create_and_list_service_requests() {
    request::<App, _, _>(|request, ctx| async move {
        let user = prepare_data::init_user_login(&request, &ctx).await;
        let (auth_key, auth_val) = prepare_data::auth_header(&user.token);

        let create_payload = serde_json::json!({
            "title": "Fix plumbing in bathroom",
            "description": "Leaking pipe under sink needs replacement."
        });

        let response = request
            .post("/api/services/requests/")
            .add_header(auth_key.clone(), auth_val.clone())
            .json(&create_payload)
            .await;

        assert_eq!(response.status_code(), 200);

        let list_resp = request
            .get("/api/services/requests/")
            .add_header(auth_key, auth_val)
            .await;

        assert_eq!(list_resp.status_code(), 200);
    })
    .await;
}
