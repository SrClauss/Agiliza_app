use crate::models::_entities::service_categories;
use loco_rs::prelude::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CategoryQueryParams {
    pub slug: Option<String>,
}

#[debug_handler]
async fn list_categories(
    State(ctx): State<AppContext>,
    Query(query): Query<CategoryQueryParams>,
) -> Result<Response> {
    let mut db_query = service_categories::Entity::find()
        .filter(service_categories::Column::IsActive.eq(true));

    if let Some(slug) = query.slug {
        db_query = db_query.filter(service_categories::Column::Slug.eq(slug));
    }

    let categories = db_query.all(&ctx.db).await?;
    format::json(categories)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/categories")
        .add("/", get(list_categories))
}
