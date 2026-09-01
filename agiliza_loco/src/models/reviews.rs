use loco_rs::prelude::*;
use sea_orm::entity::prelude::*;

pub use super::_entities::reviews::{self, ActiveModel, Entity, Model};

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if insert && self.id.is_not_set() {
            let mut this = self;
            this.id = sea_orm::ActiveValue::Set(uuid::Uuid::new_v4());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

impl Model {
    pub async fn update_professional_rating(db: &DatabaseConnection, prof_id: uuid::Uuid) -> ModelResult<()> {
        let reviews_list = Entity::find()
            .filter(super::_entities::reviews::Column::ProfessionalProfileId.eq(prof_id))
            .all(db)
            .await?;

        let total = reviews_list.len() as i32;
        let avg = if total > 0 {
            let sum: i32 = reviews_list.iter().map(|r| r.rating).sum();
            rust_decimal::Decimal::from(sum) / rust_decimal::Decimal::from(total)
        } else {
            rust_decimal::Decimal::new(50, 1)
        };

        if let Some(prof) = super::_entities::professional_profiles::Entity::find_by_id(prof_id).one(db).await? {
            let mut active: super::_entities::professional_profiles::ActiveModel = prof.into();
            active.average_rating = sea_orm::ActiveValue::Set(avg.round_dp(1));
            active.total_reviews = sea_orm::ActiveValue::Set(total);
            active.update(db).await?;
        }
        Ok(())
    }
}
