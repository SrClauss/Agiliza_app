use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(SubscriptionPlans::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SubscriptionPlans::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(SubscriptionPlans::Name).string().not_null())
                    .col(ColumnDef::new(SubscriptionPlans::PriceCents).integer().not_null().default(0))
                    .col(ColumnDef::new(SubscriptionPlans::MonthlyUnlockLimit).integer().not_null().default(5))
                    .col(ColumnDef::new(SubscriptionPlans::StripePriceId).string().null())
                    .col(ColumnDef::new(SubscriptionPlans::Features).text().null())
                    .col(ColumnDef::new(SubscriptionPlans::IsActive).boolean().not_null().default(true))
                    .col(
                        ColumnDef::new(SubscriptionPlans::CreatedAt)
                            .date_time()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(SubscriptionPlans::UpdatedAt)
                            .date_time()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(SubscriptionPlans::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum SubscriptionPlans {
    Table,
    Id,
    Name,
    PriceCents,
    MonthlyUnlockLimit,
    StripePriceId,
    Features,
    IsActive,
    CreatedAt,
    UpdatedAt,
}
