use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ChatMessages::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ChatMessages::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ChatMessages::ServiceRequestId).uuid().not_null())
                    .col(ColumnDef::new(ChatMessages::SenderId).uuid().not_null())
                    .col(ColumnDef::new(ChatMessages::Content).text().not_null())
                    .col(
                        ColumnDef::new(ChatMessages::CreatedAt)
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
            .drop_table(Table::drop().table(ChatMessages::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ChatMessages {
    Table,
    Id,
    ServiceRequestId,
    SenderId,
    Content,
    CreatedAt,
}
