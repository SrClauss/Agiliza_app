use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(DeriveIden)]
enum ProfessionalProfiles {
    Table,
    SubscriptionStatus,
    SubscriptionEndDate,
    PaymentGatewayCustomerId,
    PaymentGatewaySubscriptionId,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .add_column(
                    ColumnDef::new(ProfessionalProfiles::SubscriptionStatus)
                        .string()
                        .not_null()
                        .default("inactive"),
                )
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .add_column(
                    ColumnDef::new(ProfessionalProfiles::SubscriptionEndDate).timestamp_with_time_zone(),
                )
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .add_column(
                    ColumnDef::new(ProfessionalProfiles::PaymentGatewayCustomerId).string(),
                )
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .add_column(
                    ColumnDef::new(ProfessionalProfiles::PaymentGatewaySubscriptionId).string(),
                )
                .to_owned(),
        )
        .await?;

        Ok(())
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .drop_column(ProfessionalProfiles::SubscriptionStatus)
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .drop_column(ProfessionalProfiles::SubscriptionEndDate)
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .drop_column(ProfessionalProfiles::PaymentGatewayCustomerId)
                .to_owned(),
        )
        .await?;

        m.alter_table(
            Table::alter()
                .table(ProfessionalProfiles::Table)
                .drop_column(ProfessionalProfiles::PaymentGatewaySubscriptionId)
                .to_owned(),
        )
        .await?;

        Ok(())
    }
}
