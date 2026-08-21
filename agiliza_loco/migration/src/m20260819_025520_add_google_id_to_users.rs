use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        add_column(m, "users", "google_id", ColType::StringNull).await?;
        add_column(m, "users", "auth_provider", ColType::StringNull).await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        remove_column(m, "users", "google_id").await?;
        remove_column(m, "users", "auth_provider").await?;
        Ok(())
    }
}
