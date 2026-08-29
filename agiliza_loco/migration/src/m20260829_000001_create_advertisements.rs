use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Advertisements::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Advertisements::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Advertisements::AdType).string().not_null())
                    .col(ColumnDef::new(Advertisements::Title).string().not_null())
                    .col(ColumnDef::new(Advertisements::Subtitle).string().null())
                    .col(ColumnDef::new(Advertisements::BannerImageUrl).string().not_null())
                    .col(ColumnDef::new(Advertisements::TargetUrl).string().null())
                    .col(ColumnDef::new(Advertisements::ProfessionalUserId).uuid().null())
                    .col(ColumnDef::new(Advertisements::CategoryId).string().null())
                    .col(ColumnDef::new(Advertisements::Status).string().not_null())
                    .col(ColumnDef::new(Advertisements::Priority).integer().not_null().default(0))
                    .col(ColumnDef::new(Advertisements::ExpiresAt).date_time().null())
                    .col(
                        ColumnDef::new(Advertisements::CreatedAt)
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
            .drop_table(Table::drop().table(Advertisements::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Advertisements {
    Table,
    Id,
    AdType,
    Title,
    Subtitle,
    BannerImageUrl,
    TargetUrl,
    ProfessionalUserId,
    CategoryId,
    Status,
    Priority,
    ExpiresAt,
    CreatedAt,
}
