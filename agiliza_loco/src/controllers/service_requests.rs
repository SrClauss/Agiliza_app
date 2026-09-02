use crate::models::_entities::{
    professional_profile_categories, professional_profiles, reviews, service_requests, unlocked_contacts, users,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect, Set, PaginatorTrait};
use serde::{Deserialize, Serialize};
use chrono::Datelike;

#[derive(Debug, Deserialize)]
pub struct RequestQueryParams {
    pub status: Option<String>,
    pub page: Option<u64>,
    pub per_page: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedServiceRequestsDto {
    pub items: Vec<ServiceRequestDto>,
    pub total_items: u64,
    pub total_pages: u64,
    pub page: u64,
    pub per_page: u64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateServiceRequestParams {
    pub professional_profile: Option<uuid::Uuid>,
    pub category: Option<String>,
    pub title: String,
    pub description: String,
    pub requested_date: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub address: Option<String>,
    pub latitude: Option<rust_decimal::Decimal>,
    pub longitude: Option<rust_decimal::Decimal>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateStatusParams {
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct ServiceRequestDto {
    pub id: uuid::Uuid,
    pub client_id: uuid::Uuid,
    pub professional_profile_id: Option<uuid::Uuid>,
    pub service_category_id: Option<String>,
    pub title: String,
    pub description: String,
    pub status: String,
    pub requested_date: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub scheduled_date: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub address: Option<String>,
    pub latitude: Option<rust_decimal::Decimal>,
    pub longitude: Option<rust_decimal::Decimal>,
    pub quoted_price: Option<rust_decimal::Decimal>,
    pub completed_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub cancelled_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    
    // Extracted from client
    pub client_name: String,
    pub client_phone: Option<String>,
    pub client_email: Option<String>,
    pub client_profile_image: Option<String>,
    pub professional_profile_image: Option<String>,
    pub is_unlocked: bool,
    pub is_reviewed: bool,
}

#[debug_handler]
async fn list_service_requests(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(query): Query<RequestQueryParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await else {
        return unauthorized("Invalid or expired token!");
    };
    let mut db_query = service_requests::Entity::find()
        .order_by_desc(service_requests::Column::CreatedAt);

    if let Some(status) = &query.status {
        db_query = db_query.filter(service_requests::Column::Status.eq(status));
    }

    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    let filtered_query = if user.is_staff.unwrap_or(false) {
        db_query
    } else {
        let mut condition = sea_orm::Condition::any()
            .add(service_requests::Column::ClientId.eq(user.id));

        if let Some(prof) = &prof {
            let prof_cats = professional_profile_categories::Entity::find()
                .filter(professional_profile_categories::Column::ProfessionalProfileId.eq(prof.id))
                .all(&ctx.db)
                .await?;
            let prof_cat_ids: Vec<String> = prof_cats.into_iter().map(|c| c.service_category_id).collect();

            // Strictly filter open requests by professional's registered categories, excluding own client requests
            let prof_open_cond = sea_orm::Condition::all()
                .add(service_requests::Column::ClientId.ne(user.id))
                .add(service_requests::Column::ProfessionalProfileId.is_null())
                .add(service_requests::Column::Status.is_in(vec!["OPEN".to_string(), "PENDING".to_string()]))
                .add(service_requests::Column::ServiceCategoryId.is_in(prof_cat_ids));

            condition = condition
                .add(service_requests::Column::ProfessionalProfileId.eq(prof.id))
                .add(prof_open_cond);
        }

        db_query.filter(condition)
    };

    let is_paginated = query.page.is_some() || query.per_page.is_some();
    let page_num = query.page.unwrap_or(1).max(1);
    let per_page_num = query.per_page.unwrap_or(10).min(10).max(1);

    let paginator = filtered_query.paginate(&ctx.db, per_page_num);
    let total_items = paginator.num_items().await?;
    let total_pages = paginator.num_pages().await?;
    let requests = paginator.fetch_page(page_num - 1).await?;

    let mut dtos = Vec::new();
    for req in requests {
        let client_user = users::Entity::find_by_id(req.client_id).one(&ctx.db).await?;
        let mut is_unlocked = false;

        // If the current user is the client, they see everything. If they are staff, they see everything.
        if user.id == req.client_id || user.is_staff.unwrap_or(false) {
            is_unlocked = true;
        } else if let Some(p) = &prof {
            // Check if professional unlocked this specific service request or contact
            let unlocked = unlocked_contacts::Entity::find()
                .filter(unlocked_contacts::Column::ProfessionalProfileId.eq(p.id))
                .filter(
                    sea_orm::Condition::any()
                        .add(unlocked_contacts::Column::ServiceRequestId.eq(req.id))
                        .add(
                            sea_orm::Condition::all()
                                .add(unlocked_contacts::Column::ServiceRequestId.is_null())
                                .add(unlocked_contacts::Column::ClientId.eq(req.client_id))
                        )
                )
                .one(&ctx.db)
                .await?;
            if unlocked.is_some() {
                is_unlocked = true;
            }
        }

        let mut dto = ServiceRequestDto {
            id: req.id,
            client_id: req.client_id,
            professional_profile_id: req.professional_profile_id,
            service_category_id: req.service_category_id,
            title: req.title,
            description: req.description,
            status: req.status,
            requested_date: req.requested_date,
            scheduled_date: req.scheduled_date,
            address: req.address,
            latitude: req.latitude,
            longitude: req.longitude,
            quoted_price: req.quoted_price,
            completed_at: req.completed_at,
            cancelled_at: req.cancelled_at,
            client_name: "Cliente Anônimo".to_string(),
            client_phone: None,
            client_email: None,
            client_profile_image: None,
            professional_profile_image: None,
            is_unlocked,
            is_reviewed: req.is_reviewed,
        };

        if let Some(c) = client_user {
            dto.client_profile_image = c.profile_image.clone();
            
            if is_unlocked {
                dto.client_name = c.name;
                dto.client_phone = c.phone;
                dto.client_email = Some(c.email);
            } else {
                // Return masked data
                // Name is just the first name
                dto.client_name = c.name.split(' ').next().unwrap_or("Cliente").to_string();
                dto.address = None; // Hide full address
                // Latitude/Longitude could be rounded or kept for distance calc
            }
        }
        
        // Populate professional profile image if applicable
        if let Some(prof_id) = req.professional_profile_id {
            if let Ok(Some(prof_model)) = professional_profiles::Entity::find_by_id(prof_id).one(&ctx.db).await {
                if let Ok(Some(prof_user)) = users::Entity::find_by_id(prof_model.user_id).one(&ctx.db).await {
                    dto.professional_profile_image = prof_user.profile_image;
                }
            }
        }

        dtos.push(dto);
    }

    if is_paginated {
        format::json(PaginatedServiceRequestsDto {
            items: dtos,
            total_items,
            total_pages,
            page: page_num,
            per_page: per_page_num,
        })
    } else {
        format::json(dtos)
    }
}

#[debug_handler]
async fn create_service_request(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<CreateServiceRequestParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await else {
        return unauthorized("Invalid or expired token!");
    };

    let req = service_requests::ActiveModel {
        client_id: Set(user.id),
        professional_profile_id: Set(params.professional_profile),
        service_category_id: Set(params.category),
        title: Set(params.title),
        description: Set(params.description),
        status: Set("PENDING".to_string()),
        requested_date: Set(params.requested_date),
        address: Set(params.address),
        latitude: Set(params.latitude),
        longitude: Set(params.longitude),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    // Push notifications para o profissional específico
    let db_clone = ctx.db.clone();
    let req_title = req.title.clone();
    let client_name = user.name.clone();
    let target_prof_id = params.professional_profile;

    tokio::spawn(async move {
        if let Some(prof_id) = target_prof_id {
            if let Ok(Some(prof)) = professional_profiles::Entity::find_by_id(prof_id).one(&db_clone).await {
                crate::services::push::send_web_push(
                    &db_clone,
                    prof.user_id,
                    &format!("🔔 Novo Pedido de {}!", client_name),
                    &format!("Solicitação: {}", req_title),
                    "/pro"
                ).await;
            }
        }
    });

    format::json(req)
}

#[debug_handler]
async fn get_service_request(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await else {
        return unauthorized("Invalid or expired token!");
    };
    let req = service_requests::Entity::find_by_id(id).one(&ctx.db).await?;

    let Some(r) = req else {
        return not_found();
    };

    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    let client_user = users::Entity::find_by_id(r.client_id).one(&ctx.db).await?;
    let mut is_unlocked = false;

    if user.id == r.client_id || user.is_staff.unwrap_or(false) {
        is_unlocked = true;
    } else if let Some(p) = &prof {
        let unlocked = unlocked_contacts::Entity::find()
            .filter(unlocked_contacts::Column::ProfessionalProfileId.eq(p.id))
            .filter(unlocked_contacts::Column::ClientId.eq(r.client_id))
            .one(&ctx.db)
            .await?;
        if unlocked.is_some() {
            is_unlocked = true;
        }
    }

    let mut dto = ServiceRequestDto {
        id: r.id,
        client_id: r.client_id,
        professional_profile_id: r.professional_profile_id,
        service_category_id: r.service_category_id,
        title: r.title,
        description: r.description,
        status: r.status,
        requested_date: r.requested_date,
        scheduled_date: r.scheduled_date,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        quoted_price: r.quoted_price,
        completed_at: r.completed_at,
        cancelled_at: r.cancelled_at,
        client_name: "Cliente Anônimo".to_string(),
        client_phone: None,
        client_email: None,
        client_profile_image: None,
        professional_profile_image: None,
        is_unlocked,
        is_reviewed: r.is_reviewed,
    };

    if let Some(c) = client_user {
        dto.client_profile_image = c.profile_image.clone();
        
        if is_unlocked {
            dto.client_name = c.name;
            dto.client_phone = c.phone;
            dto.client_email = Some(c.email);
        } else {
            dto.client_name = c.name.split(' ').next().unwrap_or("Cliente").to_string();
            dto.address = None;
        }
    }
    
    // Populate professional profile image if applicable
    if let Some(prof_id) = r.professional_profile_id {
        if let Ok(Some(prof_model)) = professional_profiles::Entity::find_by_id(prof_id).one(&ctx.db).await {
            if let Ok(Some(prof_user)) = users::Entity::find_by_id(prof_model.user_id).one(&ctx.db).await {
                dto.professional_profile_image = prof_user.profile_image;
            }
        }
    }

    format::json(dto)
}

#[debug_handler]
async fn unlock_contact(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await else {
        return unauthorized("Invalid or expired token!");
    };
    let req = service_requests::Entity::find_by_id(id).one(&ctx.db).await?;

    let Some(r) = req else {
        return not_found();
    };

    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    let Some(p) = prof else {
        return unauthorized("Only professionals can unlock contacts.");
    };

    // Check if already unlocked
    let existing = unlocked_contacts::Entity::find()
        .filter(unlocked_contacts::Column::ProfessionalProfileId.eq(p.id))
        .filter(unlocked_contacts::Column::ClientId.eq(r.client_id))
        .one(&ctx.db)
        .await?;

    if existing.is_some() {
        return format::json(serde_json::json!({ "success": true, "message": "Já desbloqueado." }));
    }

    // Determine limit dinamico do banco de dados
    let plan = crate::models::_entities::subscription_plans::Entity::find_by_id(&p.subscription_plan)
        .one(&ctx.db)
        .await?;
    let limit = plan.map(|pl| pl.monthly_unlock_limit as u64).unwrap_or(5);

    // Get usage in current month
    let now = chrono::Utc::now();
    let start_of_month = chrono::NaiveDate::from_ymd_opt(now.date_naive().year(), now.date_naive().month(), 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();

    use sea_orm::QuerySelect;
    let count = unlocked_contacts::Entity::find()
        .filter(unlocked_contacts::Column::ProfessionalProfileId.eq(p.id))
        .filter(unlocked_contacts::Column::CreatedAt.gte(start_of_month))
        .count(&ctx.db)
        .await?;

    if count >= limit {
        return unauthorized("Você atingiu o limite de desbloqueios do seu plano neste mês.");
    }

    // Create unlock record
    let _unlocked = unlocked_contacts::ActiveModel {
        professional_profile_id: Set(p.id),
        client_id: Set(r.client_id),
        service_request_id: Set(Some(r.id)),
        ..Default::default()
    }
    .insert(&ctx.db)
    .await?;

    // Disparar Push Notification para o cliente avisando que o profissional aceitou/desbloqueou o pedido
    let db_clone = ctx.db.clone();
    let client_uid = r.client_id;
    let req_id_val = r.id;
    let req_title_val = r.title.clone();
    let prof_name = user.name.clone();

    // Atualizar status do pedido diretamente para IN_PROGRESS se estiver PENDING / OPEN / ACCEPTED
    let _ = r.transition_to(&ctx.db, "IN_PROGRESS", Some(p.id)).await;

    tokio::spawn(async move {
        crate::services::push::send_web_push(
            &db_clone,
            client_uid,
            "🎉 Um Profissional Aceitou Seu Pedido!",
            &format!("{} desbloqueou seu pedido \"{}\" e está pronto para conversar no chat.", prof_name, req_title_val),
            &format!("/chat/{}", req_id_val)
        ).await;
    });

    format::json(serde_json::json!({ "success": true, "remaining": limit - count - 1 }))
}

#[debug_handler]
async fn update_status(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(id): Path<uuid::Uuid>,
    Json(params): Json<UpdateStatusParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await else {
        return unauthorized("Invalid or expired token!");
    };
    let req = service_requests::Entity::find_by_id(id).one(&ctx.db).await?;

    let Some(req) = req else {
        return not_found();
    };

    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    let prof_id = prof.map(|p| p.id);
    let client_id_val = req.client_id;
    let req_title_val = req.title.clone();
    let req_id_val = req.id;
    let new_st = params.status.clone();
    let actor_is_client = user.id == client_id_val;
    let prof_profile_id_val = req.professional_profile_id.or(prof_id);

    match req.transition_to(&ctx.db, &params.status, prof_id).await {
        Ok(updated) => {
            // Disparar Push Notifications de acordo com a mudança de status
            let db_clone = ctx.db.clone();
            tokio::spawn(async move {
                match new_st.as_str() {
                    "ACCEPTED" | "IN_PROGRESS" => {
                        if !actor_is_client {
                            crate::services::push::send_web_push(
                                &db_clone,
                                client_id_val,
                                "🚀 Pedido em Andamento!",
                                &format!("O atendimento para o pedido \"{}\" foi iniciado.", req_title_val),
                                &format!("/chat/{}", req_id_val)
                            ).await;
                        }
                    },
                    "COMPLETED" => {
                        if !actor_is_client {
                            // Profissional concluiu -> notifica cliente para avaliar
                            crate::services::push::send_web_push(
                                &db_clone,
                                client_id_val,
                                "⭐ Pedido Finalizado! Avalie o Serviço",
                                &format!("O serviço \"{}\" foi concluído. Avalie o atendimento do profissional!", req_title_val),
                                "/cliente/pedidos"
                            ).await;
                        } else if let Some(prof_pid) = prof_profile_id_val {
                            // Cliente concluiu -> notifica profissional
                            if let Ok(Some(prof_rec)) = professional_profiles::Entity::find_by_id(prof_pid).one(&db_clone).await {
                                crate::services::push::send_web_push(
                                    &db_clone,
                                    prof_rec.user_id,
                                    "✅ Pedido Concluído pelo Cliente!",
                                    &format!("O cliente confirmou a conclusão de \"{}\".", req_title_val),
                                    "/pro/servicos"
                                ).await;
                            }
                        }
                    },
                    "CANCELLED" => {
                        let notify_uid = if actor_is_client {
                            if let Some(prof_pid) = prof_profile_id_val {
                                if let Ok(Some(prof_rec)) = professional_profiles::Entity::find_by_id(prof_pid).one(&db_clone).await {
                                    Some(prof_rec.user_id)
                                } else { None }
                            } else { None }
                        } else {
                            Some(client_id_val)
                        };

                        if let Some(to_uid) = notify_uid {
                            crate::services::push::send_web_push(
                                &db_clone,
                                to_uid,
                                "❌ Pedido Cancelado",
                                &format!("O serviço \"{}\" foi cancelado.", req_title_val),
                                if actor_is_client { "/pro/servicos" } else { "/cliente/pedidos" }
                            ).await;
                        }
                    },
                    _ => {}
                }
            });

            format::json(updated)
        },
        Err(err) => bad_request(err.to_string()),
    }
}

#[debug_handler]
async fn dashboard(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let Ok(user) = users::Model::find_by_id(&ctx.db, &auth.claims.pid).await else {
        return unauthorized("Invalid or expired token!");
    };
    let prof = professional_profiles::Entity::find()
        .filter(professional_profiles::Column::UserId.eq(user.id))
        .one(&ctx.db)
        .await?;

    let Some(prof) = prof else {
        return not_found();
    };

    let all_requests = service_requests::Entity::find().all(&ctx.db).await?;

    let pending_requests = all_requests
        .iter()
        .filter(|r| {
            r.professional_profile_id == Some(prof.id)
                || (r.professional_profile_id.is_none() && r.status == "PENDING")
        })
        .count();

    let active_jobs = all_requests
        .iter()
        .filter(|r| {
            r.professional_profile_id == Some(prof.id)
                && (r.status == "ACCEPTED" || r.status == "SCHEDULED")
        })
        .count();

    let completed_jobs = all_requests
        .iter()
        .filter(|r| r.professional_profile_id == Some(prof.id) && r.status == "COMPLETED")
        .count();

    let monthly_earnings: rust_decimal::Decimal = all_requests
        .iter()
        .filter(|r| r.professional_profile_id == Some(prof.id) && r.status == "COMPLETED")
        .filter_map(|r| r.quoted_price)
        .sum();

    let upcoming_requests: Vec<_> = all_requests
        .into_iter()
        .filter(|r| {
            r.professional_profile_id == Some(prof.id)
                && (r.status == "ACCEPTED" || r.status == "SCHEDULED")
        })
        .take(3)
        .collect();

    let recent_reviews: Vec<reviews::Model> = reviews::Entity::find()
        .filter(reviews::Column::ProfessionalProfileId.eq(prof.id))
        .order_by_desc(reviews::Column::CreatedAt)
        .limit(3)
        .all(&ctx.db)
        .await?;

    format::json(serde_json::json!({
        "full_name": user.name,
        "is_verified": user.is_verified.unwrap_or(false),
        "online": user.is_active.unwrap_or(true),
        "average_rating": prof.average_rating,
        "pending_requests": pending_requests,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "monthly_earnings": monthly_earnings,
        "upcoming_appointments": upcoming_requests.iter().map(|r| serde_json::json!({
            "id": r.id.to_string(),
            "title": r.title,
            "scheduled_date": r.scheduled_date.map(|d| d.to_rfc3339()),
            "requested_date": r.requested_date.map(|d| d.to_rfc3339()),
            "status": r.status,
            "address": r.address
        })).collect::<Vec<_>>(),
        "recent_reviews": recent_reviews.iter().map(|rev| serde_json::json!({
            "id": rev.id.to_string(),
            "rating": rev.rating,
            "comment": rev.comment,
            "created_at": rev.created_at.to_rfc3339()
        })).collect::<Vec<_>>()
    }))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/services/requests")
        .add("/", get(list_service_requests).post(create_service_request))
        .add("/dashboard", get(dashboard))
        .add("/{id}", get(get_service_request))
        .add("/{id}/status", post(update_status))
        .add("/{id}/unlock", post(unlock_contact))
}
