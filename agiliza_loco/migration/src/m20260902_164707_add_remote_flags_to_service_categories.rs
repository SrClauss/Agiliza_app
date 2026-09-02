use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ServiceCategories::Table)
                    .add_column(
                        ColumnDef::new(ServiceCategories::IsRemote)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(ServiceCategories::Table)
                    .add_column(
                        ColumnDef::new(ServiceCategories::IsPhysical)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ServiceCategories::Table)
                    .drop_column(ServiceCategories::IsRemote)
                    .drop_column(ServiceCategories::IsPhysical)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ServiceCategories {
    Table,
    IsRemote,
    IsPhysical,
}
