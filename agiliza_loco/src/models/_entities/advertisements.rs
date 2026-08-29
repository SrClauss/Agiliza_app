use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "advertisements")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub ad_type: String, // "PROFESSIONAL_DIRECT" or "EXTERNAL_LINK"
    pub title: String,
    pub subtitle: Option<String>,
    pub banner_image_url: String,
    pub target_url: Option<String>,
    pub professional_user_id: Option<Uuid>,
    pub category_id: Option<String>,
    pub status: String, // "PENDING_APPROVAL", "ACTIVE", "EXPIRED", "REJECTED"
    pub priority: i32,
    pub expires_at: Option<DateTimeWithTimeZone>,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
