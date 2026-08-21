use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_query::{Alias, ColumnDef, Table};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.create_table(
            Table::create()
                .table(Alias::new("service_categories"))
                .if_not_exists()
                .col(ColumnDef::new(Alias::new("created_at")).timestamp_with_time_zone().not_null().default(sea_orm_migration::sea_query::Expr::current_timestamp()))
                .col(ColumnDef::new(Alias::new("updated_at")).timestamp_with_time_zone().not_null().default(sea_orm_migration::sea_query::Expr::current_timestamp()))
                .col(ColumnDef::new(Alias::new("id")).string().not_null().primary_key())
                .col(ColumnDef::new(Alias::new("name")).string().not_null().unique_key())
                .col(ColumnDef::new(Alias::new("slug")).string().not_null().unique_key())
                .col(ColumnDef::new(Alias::new("icon")).string())
                .col(ColumnDef::new(Alias::new("description")).text())
                .col(ColumnDef::new(Alias::new("is_active")).boolean().not_null().default(true))
                .to_owned()
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.drop_table(Table::drop().table(Alias::new("service_categories")).to_owned()).await
    }
}
