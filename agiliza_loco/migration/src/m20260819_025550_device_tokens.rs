use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "device_tokens",
            &[
                ("id", ColType::PkUuid),
                ("user_id", ColType::Uuid),
                ("token", ColType::StringUniq),
                ("platform", ColType::String),
                ("is_active", ColType::Boolean),
            ],
            &[]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "device_tokens").await
    }
}
