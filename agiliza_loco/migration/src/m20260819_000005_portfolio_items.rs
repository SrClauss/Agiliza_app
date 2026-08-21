use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "portfolio_items",
            &[
                ("id", ColType::PkUuid),
                ("professional_profile_id", ColType::Uuid),
                ("title", ColType::String),
                ("description", ColType::TextNull),
                ("image", ColType::StringNull),
            ],
            &[],
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "portfolio_items").await?;
        Ok(())
    }
}
