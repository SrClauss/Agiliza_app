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
    pub async fn update_professional_rating(_db: &DatabaseConnection, _prof_id: uuid::Uuid) -> ModelResult<()> {
        Ok(())
    }
}
