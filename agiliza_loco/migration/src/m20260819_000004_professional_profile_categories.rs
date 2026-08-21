use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "professional_profile_categories",
            &[
                ("id", ColType::PkUuid),
                ("professional_profile_id", ColType::Uuid),
                ("service_category_id", ColType::String),
            ],
            &[],
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "professional_profile_categories").await?;
        Ok(())
    }
}
