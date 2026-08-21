use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "professional_profiles",
            &[
                ("id", ColType::PkUuid),
                ("user_id", ColType::Uuid),
                ("bio", ColType::TextNull),
                ("years_experience", ColType::Integer),
                ("hourly_rate", ColType::Decimal),
                ("service_radius_km", ColType::Integer),
                ("address", ColType::TextNull),
                ("latitude", ColType::DecimalNull),
                ("longitude", ColType::DecimalNull),
                ("average_rating", ColType::Decimal),
                ("total_reviews", ColType::Integer),
            ],
            &[],
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "professional_profiles").await?;
        Ok(())
    }
}
