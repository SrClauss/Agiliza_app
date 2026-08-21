use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "service_requests",
            &[
                ("id", ColType::PkUuid),
                ("client_id", ColType::Uuid),
                ("professional_profile_id", ColType::UuidNull),
                ("service_category_id", ColType::StringNull),
                ("title", ColType::String),
                ("description", ColType::Text),
                ("status", ColType::String),
                ("requested_date", ColType::TimestampWithTimeZoneNull),
                ("scheduled_date", ColType::TimestampWithTimeZoneNull),
                ("address", ColType::TextNull),
                ("latitude", ColType::DecimalNull),
                ("longitude", ColType::DecimalNull),
                ("quoted_price", ColType::DecimalNull),
                ("completed_at", ColType::TimestampWithTimeZoneNull),
                ("cancelled_at", ColType::TimestampWithTimeZoneNull),
            ],
            &[],
        )
        .await?;
        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "service_requests").await?;
        Ok(())
    }
}
