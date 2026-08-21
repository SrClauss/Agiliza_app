use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ServiceCategories::Table)
                    .add_column(ColumnDef::new(ServiceCategories::ParentId).string().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(ServiceCategories::Table)
                    .drop_column(ServiceCategories::ParentId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum ServiceCategories {
    Table,
    ParentId,
}
