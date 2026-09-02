#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20220101_000001_users;
mod m20260819_000002_professional_profiles;
mod m20260819_000003_service_categories;
mod m20260819_000004_professional_profile_categories;
mod m20260819_000005_portfolio_items;
mod m20260819_000006_availability_slots;
mod m20260819_000007_favorites;
mod m20260819_000008_reviews;
mod m20260819_000009_service_requests;
mod m20260819_000010_quote_responses;

mod m20260819_025520_add_google_id_to_users;
mod m20260819_025550_device_tokens;
mod m20260819_155308_add_subscription_to_professionals;
mod m20260819_163056_create_unlocked_contacts;
mod m20260820_034757_create_chat_messages;
mod m20260820_182128_create_subscription_plans;
mod m20260820_182235_add_parent_id_to_service_categories;
mod m20260820_182323_add_block_fields_to_users;
mod m20260820_203357_add_cpf_to_users;
mod m20260829_000001_create_advertisements;
mod m20260829_000002_create_featured_professionals;
mod m20260829_023700_add_recipient_id_to_chat_messages;

mod m20260902_125643_drop_role_from_users;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20260819_000002_professional_profiles::Migration),
            Box::new(m20260819_000003_service_categories::Migration),
            Box::new(m20260819_000004_professional_profile_categories::Migration),
            Box::new(m20260819_000005_portfolio_items::Migration),
            Box::new(m20260819_000006_availability_slots::Migration),
            Box::new(m20260819_000007_favorites::Migration),
            Box::new(m20260819_000008_reviews::Migration),
            Box::new(m20260819_000009_service_requests::Migration),
            Box::new(m20260819_000010_quote_responses::Migration),
            Box::new(m20260819_025520_add_google_id_to_users::Migration),
            Box::new(m20260819_025550_device_tokens::Migration),
            Box::new(m20260819_155308_add_subscription_to_professionals::Migration),
            Box::new(m20260819_163056_create_unlocked_contacts::Migration),
            Box::new(m20260820_034757_create_chat_messages::Migration),
            Box::new(m20260820_182128_create_subscription_plans::Migration),
            Box::new(m20260820_182235_add_parent_id_to_service_categories::Migration),
            Box::new(m20260820_182323_add_block_fields_to_users::Migration),
            Box::new(m20260820_203357_add_cpf_to_users::Migration),
            Box::new(m20260829_000001_create_advertisements::Migration),
            Box::new(m20260829_000002_create_featured_professionals::Migration),
            Box::new(m20260829_023700_add_recipient_id_to_chat_messages::Migration),
            Box::new(m20260902_125643_drop_role_from_users::Migration),
        ]
    }
}