use loco_rs::prelude::*;
use chrono::Utc;
use sea_orm::Set;

pub use super::_entities::service_requests::{self, ActiveModel, Entity, Model};

impl Model {
    pub fn can_transition_to(&self, new_status: &str) -> bool {
        match self.status.as_str() {
            "PENDING" => matches!(new_status, "QUOTED" | "ACCEPTED" | "CANCELLED"),
            "QUOTED" => matches!(new_status, "ACCEPTED" | "CANCELLED"),
            "ACCEPTED" => matches!(new_status, "SCHEDULED" | "CANCELLED"),
            "SCHEDULED" => matches!(new_status, "COMPLETED" | "CANCELLED"),
            _ => false,
        }
    }

    pub async fn transition_to(
        self,
        db: &DatabaseConnection,
        new_status: &str,
        prof_id: Option<uuid::Uuid>,
    ) -> ModelResult<Model> {
        if !self.can_transition_to(new_status) {
            let msg = format!("Cannot transition from {} to {}.", self.status, new_status);
            return Err(ModelError::msg(&msg));
        }

        let mut active: ActiveModel = self.into();
        active.status = Set(new_status.to_string());

        let now = Utc::now().into();
        if new_status == "COMPLETED" {
            active.completed_at = Set(Some(now));
        } else if new_status == "CANCELLED" {
            active.cancelled_at = Set(Some(now));
        }

        if new_status == "ACCEPTED" && prof_id.is_some() {
            if active.professional_profile_id.as_ref().is_none() {
                active.professional_profile_id = Set(prof_id);
            }
        }

        let updated = active.update(db).await?;
        Ok(updated)
    }
}

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
