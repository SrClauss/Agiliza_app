use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "availability_slots",
            &[
                ("id", ColType::PkUuid),
                ("professional_profile_id", ColType::Uuid),
                ("day_of_week", ColType::Integer),
                ("start_time", ColType::String),
                ("end_time", ColType::String),
                ("is_active", ColType::Boolean),
            ],
            &[],
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "availability_slots").await?;
        Ok(())
    }
}
