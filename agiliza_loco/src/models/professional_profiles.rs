use loco_rs::prelude::*;
use sea_orm::entity::prelude::*;

pub use super::_entities::professional_profiles::{self, ActiveModel, Entity, Model};

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

pub async fn find_or_create_for_user(db: &DatabaseConnection, user_id: uuid::Uuid) -> ModelResult<Model> {
    let existing = Entity::find()
        .filter(crate::models::_entities::professional_profiles::Column::UserId.eq(user_id))
        .one(db)
        .await?;
    if let Some(profile) = existing {
        Ok(profile)
    } else {
        let active = ActiveModel {
            user_id: sea_orm::ActiveValue::Set(user_id),
            years_experience: sea_orm::ActiveValue::Set(0),
            hourly_rate: sea_orm::ActiveValue::Set(rust_decimal::Decimal::new(0, 0)),
            service_radius_km: sea_orm::ActiveValue::Set(0),
            average_rating: sea_orm::ActiveValue::Set(rust_decimal::Decimal::new(0, 0)),
            total_reviews: sea_orm::ActiveValue::Set(0),
            ..Default::default()
        };
        let inserted = active.insert(db).await?;
        Ok(inserted)
    }
}

impl Model {
    pub fn distance_km(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
        let r = 6371.0; 
        let d_lat = (lat2 - lat1).to_radians();
        let d_lon = (lon2 - lon1).to_radians();
        let a = (d_lat / 2.0).sin() * (d_lat / 2.0).sin() +
                lat1.to_radians().cos() * lat2.to_radians().cos() *
                (d_lon / 2.0).sin() * (d_lon / 2.0).sin();
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
        r * c
    }
}
