use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto(UnlockedContacts::Table)
                    .col(pk_auto(UnlockedContacts::Id))
                    .col(uuid(UnlockedContacts::ProfessionalProfileId))
                    .col(uuid(UnlockedContacts::ClientId))
                    .col(uuid_null(UnlockedContacts::ServiceRequestId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-unlocked_contacts-professional_profiles")
                            .from(UnlockedContacts::Table, UnlockedContacts::ProfessionalProfileId)
                            .to(ProfessionalProfiles::Table, ProfessionalProfiles::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-unlocked_contacts-clients")
                            .from(UnlockedContacts::Table, UnlockedContacts::ClientId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Add subscription_plan column to professional_profiles
        manager
            .alter_table(
                sea_query::Table::alter()
                    .table(ProfessionalProfiles::Table)
                    .add_column_if_not_exists(
                        sea_query::ColumnDef::new(ProfessionalProfiles::SubscriptionPlan)
                            .string()
                            .not_null()
                            .default("free")
                    )
                    .to_owned()
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UnlockedContacts::Table).to_owned())
            .await?;

        manager
            .alter_table(
                sea_query::Table::alter()
                    .table(ProfessionalProfiles::Table)
                    .drop_column(ProfessionalProfiles::SubscriptionPlan)
                    .to_owned()
            )
            .await?;

        Ok(())
    }
}

#[derive(Iden)]
pub enum UnlockedContacts {
    Table,
    Id,
    ProfessionalProfileId,
    ClientId,
    ServiceRequestId,
}

#[derive(Iden)]
pub enum ProfessionalProfiles {
    Table,
    Id,
    SubscriptionPlan,
}

#[derive(Iden)]
pub enum Users {
    Table,
    Id,
}
