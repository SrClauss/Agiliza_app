use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "quote_responses",
            &[
                ("id", ColType::PkUuid),
                ("service_request_id", ColType::Uuid),
                ("professional_profile_id", ColType::Uuid),
                ("price", ColType::Decimal),
                ("duration", ColType::String),
                ("message", ColType::TextNull),
            ],
            &[],
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "quote_responses").await?;
        Ok(())
    }
}
