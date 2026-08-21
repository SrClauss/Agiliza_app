use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, ColumnTrait, Set, QueryOrder};
use serde::{Deserialize, Serialize};
use crate::models::_entities::{
    users, subscription_plans, service_categories, professional_profiles, service_requests
};

#[derive(Debug, Deserialize, Serialize)]
pub struct PlanPayload {
    pub id: String,
    pub name: String,
    pub price_cents: i32,
    pub monthly_unlock_limit: i32,
    pub stripe_price_id: Option<String>,
    pub features: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CategoryPayload {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BlockPayload {
    pub reason: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GrantPlanPayload {
    pub plan_id: String,
}

// Middleware de verificacao de permissao Admin Staff
async fn check_admin_staff(auth: &auth::JWT, db: &DatabaseConnection) -> Result<users::Model> {
    let user = users::Model::find_by_id(db, &auth.claims.pid).await?;
    if !user.is_staff.unwrap_or(false) && user.role.as_deref() != Some("ADMIN") {
        return Err(Error::Unauthorized("Acesso restrito ao Painel Administrativo".to_string()));
    }
    Ok(user)
}

// ----------------------------------------------------
// CRUD DE PLANOS (GET, POST, PUT)
// ----------------------------------------------------
#[debug_handler]
pub async fn list_plans(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let plans = subscription_plans::Entity::find().all(&ctx.db).await?;
    format::json(plans)
}

#[debug_handler]
pub async fn upsert_plan(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(payload): Json<PlanPayload>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;

    let existing = subscription_plans::Entity::find_by_id(&payload.id).one(&ctx.db).await?;
    if let Some(plan) = existing {
        let mut active: subscription_plans::ActiveModel = plan.into();
        active.name = Set(payload.name);
        active.price_cents = Set(payload.price_cents);
        active.monthly_unlock_limit = Set(payload.monthly_unlock_limit);
        active.stripe_price_id = Set(payload.stripe_price_id);
        active.features = Set(payload.features);
        if let Some(act) = payload.is_active {
            active.is_active = Set(act);
        }
        let updated = active.update(&ctx.db).await?;
        format::json(updated)
    } else {
        let plan = subscription_plans::ActiveModel {
            id: Set(payload.id),
            name: Set(payload.name),
            price_cents: Set(payload.price_cents),
            monthly_unlock_limit: Set(payload.monthly_unlock_limit),
            stripe_price_id: Set(payload.stripe_price_id),
            features: Set(payload.features),
            is_active: Set(payload.is_active.unwrap_or(true)),
            ..Default::default()
        };
        let created = plan.insert(&ctx.db).await?;
        format::json(created)
    }
}

// ----------------------------------------------------
// CRUD DE CATEGORIAS E SUBCATEGORIAS (GET, POST, PUT)
// ----------------------------------------------------
#[debug_handler]
pub async fn list_categories(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let categories = service_categories::Entity::find().all(&ctx.db).await?;
    format::json(categories)
}

#[debug_handler]
pub async fn upsert_category(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(payload): Json<CategoryPayload>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;

    let existing = service_categories::Entity::find_by_id(&payload.id).one(&ctx.db).await?;
    if let Some(cat) = existing {
        let mut active: service_categories::ActiveModel = cat.into();
        active.name = Set(payload.name);
        active.slug = Set(payload.slug);
        active.icon = Set(payload.icon);
        active.description = Set(payload.description);
        active.parent_id = Set(payload.parent_id);
        if let Some(act) = payload.is_active {
            active.is_active = Set(act);
        }
        let updated = active.update(&ctx.db).await?;
        format::json(updated)
    } else {
        let cat = service_categories::ActiveModel {
            id: Set(payload.id),
            name: Set(payload.name),
            slug: Set(payload.slug),
            icon: Set(payload.icon),
            description: Set(payload.description),
            parent_id: Set(payload.parent_id),
            is_active: Set(payload.is_active.unwrap_or(true)),
            ..Default::default()
        };
        let created = cat.insert(&ctx.db).await?;
        format::json(created)
    }
}

// ----------------------------------------------------
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub search: Option<String>,
}

// GESTÃO DE USUÁRIOS (LISTAR COM PAGINAÇÃO E BUSCA POR NOME/EMAIL/CPF)
// ----------------------------------------------------
#[debug_handler]
pub async fn list_users(
    auth: auth::JWT,
    Query(params): Query<PaginationParams>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    use sea_orm::{PaginatorTrait, QueryFilter, ColumnTrait};
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    
    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);

    let mut query = users::Entity::find();

    if let Some(ref search) = params.search {
        let q = format!("%{}%", search.trim());
        query = query.filter(
            users::Column::Name.like(&q)
                .or(users::Column::Email.like(&q))
                .or(users::Column::Cpf.like(&q))
        );
    }

    let paginator = query
        .order_by_desc(users::Column::CreatedAt)
        .paginate(&ctx.db, page_size);

    let total = paginator.num_items().await?;
    let total_pages = paginator.num_pages().await?;
    let users_list = paginator.fetch_page(page.saturating_sub(1)).await?;

    format::json(serde_json::json!({
        "users": users_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }))
}

#[debug_handler]
pub async fn block_user(
    auth: auth::JWT,
    Path(id): Path<uuid::Uuid>,
    State(ctx): State<AppContext>,
    Json(payload): Json<BlockPayload>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let target_user = users::Model::find_by_id(&ctx.db, &id.to_string()).await?;
    let mut active: users::ActiveModel = target_user.into();
    active.is_blocked = Set(Some(true));
    active.blocked_reason = Set(Some(payload.reason));
    let updated = active.update(&ctx.db).await?;
    format::json(updated)
}

#[debug_handler]
pub async fn unblock_user(
    auth: auth::JWT,
    Path(id): Path<uuid::Uuid>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let target_user = users::Model::find_by_id(&ctx.db, &id.to_string()).await?;
    let mut active: users::ActiveModel = target_user.into();
    active.is_blocked = Set(Some(false));
    active.blocked_reason = Set(None);
    let updated = active.update(&ctx.db).await?;
    format::json(updated)
}

#[debug_handler]
pub async fn grant_plan(
    auth: auth::JWT,
    Path(id): Path<uuid::Uuid>,
    State(ctx): State<AppContext>,
    Json(payload): Json<GrantPlanPayload>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(id))
        .one(&ctx.db)
        .await?;

    if let Some(prof_model) = prof {
        let mut active: professional_profiles::ActiveModel = prof_model.into();
        active.subscription_plan = Set(payload.plan_id.clone());
        active.subscription_status = Set("active".to_string());
        let updated = active.update(&ctx.db).await?;
        format::json(updated)
    } else {
        Err(Error::NotFound)
    }
}

// ----------------------------------------------------
// ESTATÍSTICAS FINANCEIRAS E DE SERVIÇOS
// ----------------------------------------------------
#[debug_handler]
pub async fn financial_stats(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let profs = professional_profiles::Entity::find().all(&ctx.db).await?;
    let mut pro_count = 0;
    let mut premium_count = 0;
    let mut free_count = 0;

    for p in &profs {
        match p.subscription_plan.as_str() {
            "pro" => pro_count += 1,
            "premium" => premium_count += 1,
            _ => free_count += 1,
        }
    }

    let estimated_mrr_cents = (pro_count * 2990) + (premium_count * 4990);

    format::json(serde_json::json!({
        "total_professionals": profs.len(),
        "free_count": free_count,
        "pro_count": pro_count,
        "premium_count": premium_count,
        "estimated_mrr_cents": estimated_mrr_cents,
        "estimated_mrr_formatted": format!("R$ {:.2}", estimated_mrr_cents as f64 / 100.0)
    }))
}

#[debug_handler]
pub async fn service_stats(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let all_requests = service_requests::Entity::find().all(&ctx.db).await?;
    format::json(serde_json::json!({
        "total_requests": all_requests.len(),
        "requests": all_requests
    }))
}

#[derive(Debug, Deserialize, Serialize)]
pub struct InviteStaffPayload {
    pub email: String,
    pub role: Option<String>, // "ADMIN", "GERENTE", "SUPORTE"
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterStaffPayload {
    pub invite_token: String,
    pub name: String,
    pub password: String,
}

// ----------------------------------------------------
// CONVITE E CADASTRO DE STAFF POR TOKEN
// ----------------------------------------------------
#[debug_handler]
pub async fn invite_staff(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(payload): Json<InviteStaffPayload>,
) -> Result<Response> {
    let _admin = check_admin_staff(&auth, &ctx.db).await?;
    let token = format!("stf_{}", uuid::Uuid::new_v4().simple());
    let now = chrono::Utc::now();
    let assigned_role = payload.role.unwrap_or_else(|| "ADMIN".to_string());

    // Se o usuario ja existir, atualizamos seu reset_token/invite_token. Se nao, criamos a conta pendente.
    let existing = users::Entity::find().filter(users::Column::Email.eq(&payload.email)).one(&ctx.db).await?;
    if let Some(user) = existing {
        let mut active: users::ActiveModel = user.into();
        active.reset_token = Set(Some(token.clone()));
        active.reset_sent_at = Set(Some(now.into()));
        active.is_staff = Set(Some(true));
        active.role = Set(Some(assigned_role.clone()));
        active.update(&ctx.db).await?;
    } else {
        let dummy_password = loco_rs::hash::hash_password(&uuid::Uuid::new_v4().to_string())?;
        let new_staff = users::ActiveModel {
            id: Set(uuid::Uuid::new_v4()),
            email: Set(payload.email.clone()),
            password: Set(dummy_password),
            name: Set("Pendente de Registro".to_string()),
            api_key: Set(format!("ako_{}", uuid::Uuid::new_v4().simple())),
            role: Set(Some(assigned_role.clone())),
            is_staff: Set(Some(true)),
            reset_token: Set(Some(token.clone())),
            reset_sent_at: Set(Some(now.into())),
            is_verified: Set(Some(true)),
            is_active: Set(Some(true)),
            is_blocked: Set(Some(false)),
            ..Default::default()
        };
        new_staff.insert(&ctx.db).await?;
    }

    let invite_url = format!("http://localhost:3001/cadastro-staff?token={}", token);
    format::json(serde_json::json!({
        "message": "Token de convite gerado com sucesso (válido por 24 horas)",
        "invite_token": token,
        "invite_url": invite_url,
        "expires_in": "24 horas"
    }))
}

#[debug_handler]
pub async fn register_staff_with_token(
    State(ctx): State<AppContext>,
    Json(payload): Json<RegisterStaffPayload>,
) -> Result<Response> {
    let target = users::Entity::find()
        .filter(users::Column::ResetToken.eq(&payload.invite_token))
        .one(&ctx.db)
        .await?;

    if let Some(user) = target {
        // Validar expiracao de 24 horas
        if let Some(sent_at) = user.reset_sent_at {
            let sent_time: chrono::DateTime<chrono::Utc> = sent_at.into();
            let elapsed = chrono::Utc::now().signed_duration_since(sent_time);
            if elapsed.num_hours() >= 24 {
                return Err(Error::Unauthorized("Token de convite expirado (mais de 24 horas desde a criação)".to_string()));
            }
        }

        let password_hash = loco_rs::hash::hash_password(&payload.password)?;
        let mut active: users::ActiveModel = user.into();
        active.name = Set(payload.name);
        active.password = Set(password_hash);
        active.reset_token = Set(None); // consome o token de convite
        active.reset_sent_at = Set(None);
        active.is_staff = Set(Some(true));
        active.role = Set(Some("ADMIN".to_string()));
        let updated = active.update(&ctx.db).await?;

        format::json(serde_json::json!({
            "message": "Conta de administrador configurada com sucesso!",
            "user": {
                "id": updated.id,
                "name": updated.name,
                "email": updated.email,
                "role": updated.role
            }
        }))
    } else {
        Err(Error::Unauthorized("Token de convite inválido ou expirado".to_string()))
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/admin")
        .add("/plans", get(list_plans).post(upsert_plan))
        .add("/categories", get(list_categories).post(upsert_category))
        .add("/users", get(list_users))
        .add("/users/{id}/block", post(block_user))
        .add("/users/{id}/unblock", post(unblock_user))
        .add("/users/{id}/grant-plan", post(grant_plan))
        .add("/stats/financial", get(financial_stats))
        .add("/stats/services", get(service_stats))
        .add("/staff/invite", post(invite_staff))
        .add("/staff/register", post(register_staff_with_token))
}
