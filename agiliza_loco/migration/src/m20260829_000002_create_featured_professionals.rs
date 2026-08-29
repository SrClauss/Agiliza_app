use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(FeaturedProfessionals::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FeaturedProfessionals::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FeaturedProfessionals::ProfessionalProfileId).uuid().not_null())
                    .col(ColumnDef::new(FeaturedProfessionals::UserId).uuid().not_null())
                    .col(ColumnDef::new(FeaturedProfessionals::FeaturedDate).date().not_null())
                    .col(
                        ColumnDef::new(FeaturedProfessionals::CreatedAt)
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
            .drop_table(Table::drop().table(FeaturedProfessionals::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum FeaturedProfessionals {
    Table,
    Id,
    ProfessionalProfileId,
    UserId,
    FeaturedDate,
    CreatedAt,
}
