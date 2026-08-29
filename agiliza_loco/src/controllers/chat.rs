use crate::models::_entities::{chat_messages, users};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query,
    },
    response::IntoResponse,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set, Condition};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use futures_util::{SinkExt, StreamExt};

// Tipo de mensagem trafegada via WebSocket
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsChatMessage {
    pub id: uuid::Uuid,
    pub service_request_id: Option<uuid::Uuid>,
    pub sender_id: uuid::Uuid,
    pub recipient_id: Option<uuid::Uuid>,
    pub sender_name: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct WsAuthQuery {
    pub token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct IncomingWsMessage {
    pub content: String,
}

// Gerenciador global de salas de chat por UUID de Sala (Pedido ou Sala Direta)
type RoomChannels = Arc<Mutex<HashMap<uuid::Uuid, broadcast::Sender<WsChatMessage>>>>;

lazy_static::lazy_static! {
    static ref CHAT_ROOMS: RoomChannels = Arc::new(Mutex::new(HashMap::new()));
}

fn get_or_create_room(room_id: uuid::Uuid) -> broadcast::Sender<WsChatMessage> {
    let mut rooms = CHAT_ROOMS.lock().unwrap();
    rooms
        .entry(room_id)
        .or_insert_with(|| {
            let (tx, _) = broadcast::channel(100);
            tx
        })
        .clone()
}

// Gera UUID determinístico para a sala de chat direto entre dois usuários sem dependência externa
pub fn get_direct_room_id(user_a: uuid::Uuid, user_b: uuid::Uuid) -> uuid::Uuid {
    let (min_u, max_u) = if user_a < user_b { (user_a, user_b) } else { (user_b, user_a) };
    let mut bytes = [0u8; 16];
    let a_bytes = min_u.as_bytes();
    let b_bytes = max_u.as_bytes();
    for i in 0..16 {
        bytes[i] = a_bytes[i] ^ b_bytes[15 - i];
    }
    uuid::Uuid::from_bytes(bytes)
}

// Rota HTTP REST para listar mensagens antigas de um pedido
#[debug_handler]
async fn list_messages(
    _auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(request_id): Path<uuid::Uuid>,
) -> Result<Response> {
    let messages = chat_messages::Entity::find()
        .filter(chat_messages::Column::ServiceRequestId.eq(Some(request_id)))
        .order_by_asc(chat_messages::Column::CreatedAt)
        .all(&ctx.db)
        .await?;

    let mut dtos = Vec::new();
    for msg in messages {
        let sender_name = match users::Entity::find_by_id(msg.sender_id).one(&ctx.db).await? {
            Some(u) => u.name,
            None => "Usuário".to_string(),
        };

        dtos.push(WsChatMessage {
            id: msg.id,
            service_request_id: msg.service_request_id,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            sender_name,
            content: msg.content,
            created_at: msg.created_at.to_string(),
        });
    }

    format::json(dtos)
}

// Rota HTTP REST para listar mensagens de Chat Direto (sem pedido) entre Usuários
#[debug_handler]
async fn list_direct_messages(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(target_user_id): Path<uuid::Uuid>,
) -> Result<Response> {
    let current_user_id = uuid::Uuid::parse_str(&auth.claims.pid).map_err(|e| Error::BadRequest(e.to_string()))?;

    let messages = chat_messages::Entity::find()
        .filter(
            Condition::any()
                .add(
                    Condition::all()
                        .add(chat_messages::Column::SenderId.eq(current_user_id))
                        .add(chat_messages::Column::RecipientId.eq(Some(target_user_id)))
                )
                .add(
                    Condition::all()
                        .add(chat_messages::Column::SenderId.eq(target_user_id))
                        .add(chat_messages::Column::RecipientId.eq(Some(current_user_id)))
                )
        )
        .order_by_asc(chat_messages::Column::CreatedAt)
        .all(&ctx.db)
        .await?;

    let mut dtos = Vec::new();
    for msg in messages {
        let sender_name = match users::Entity::find_by_id(msg.sender_id).one(&ctx.db).await? {
            Some(u) => u.name,
            None => "Usuário".to_string(),
        };

        dtos.push(WsChatMessage {
            id: msg.id,
            service_request_id: msg.service_request_id,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            sender_name,
            content: msg.content,
            created_at: msg.created_at.to_string(),
        });
    }

    format::json(dtos)
}

// Rota de Upgrade WebSocket para Pedidos
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(request_id): Path<uuid::Uuid>,
    Query(query): Query<WsAuthQuery>,
    State(ctx): State<AppContext>,
) -> impl IntoResponse {
    let user_id = extract_user_id(&query, &ctx);
    ws.on_upgrade(move |socket| handle_socket(socket, request_id, user_id, Some(request_id), None, ctx))
}

// Rota de Upgrade WebSocket para Chat Direto entre Usuários (sem pedido)
pub async fn ws_direct_handler(
    ws: WebSocketUpgrade,
    Path(target_user_id): Path<uuid::Uuid>,
    Query(query): Query<WsAuthQuery>,
    State(ctx): State<AppContext>,
) -> impl IntoResponse {
    let user_id = extract_user_id(&query, &ctx);
    let room_id = get_direct_room_id(user_id, target_user_id);
    ws.on_upgrade(move |socket| handle_socket(socket, room_id, user_id, None, Some(target_user_id), ctx))
}

fn extract_user_id(query: &WsAuthQuery, ctx: &AppContext) -> uuid::Uuid {
    if let Some(token) = &query.token {
        let clean_token = token.trim_start_matches("Bearer ").trim();
        if let Some(auth_config) = &ctx.config.auth {
            if let Some(jwt_config) = &auth_config.jwt {
                if let Ok(claims) = loco_rs::auth::jwt::JWT::new(&jwt_config.secret).validate(clean_token) {
                    if let Ok(uid) = uuid::Uuid::parse_str(&claims.claims.pid) {
                        return uid;
                    }
                }
            }
        }
    }
    uuid::Uuid::nil()
}

async fn handle_socket(
    socket: WebSocket,
    room_id: uuid::Uuid,
    user_id: uuid::Uuid,
    req_id: Option<uuid::Uuid>,
    recipient_id: Option<uuid::Uuid>,
    ctx: AppContext,
) {
    let tx = get_or_create_room(room_id);
    let mut rx = tx.subscribe();

    let (mut sender_ws, mut receiver_ws) = socket.split();

    // Task de envio pro WS
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if let Ok(json_str) = serde_json::to_string(&msg) {
                if sender_ws.send(Message::Text(json_str.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Task de recepção do WS
    let ctx_clone = ctx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver_ws.next().await {
            if let Message::Text(text) = msg {
                if let Ok(incoming) = serde_json::from_str::<IncomingWsMessage>(&text) {
                    if incoming.content.trim().is_empty() {
                        continue;
                    }

                    let msg_id = uuid::Uuid::new_v4();
                    let now: sea_orm::prelude::DateTimeWithTimeZone = chrono::Utc::now().into();

                    // Salvar mensagem no banco (Com ou Sem Pedido)
                    let active_msg = chat_messages::ActiveModel {
                        id: Set(msg_id),
                        service_request_id: Set(req_id),
                        sender_id: Set(user_id),
                        recipient_id: Set(recipient_id),
                        content: Set(incoming.content.clone()),
                        created_at: Set(now),
                    };

                    if let Err(err) = active_msg.insert(&ctx_clone.db).await {
                        tracing::error!("[Chat DB Error] Falha ao persistir mensagem {}: {:?}", msg_id, err);
                    }

                    // Buscar nome do remetente
                    let sender_name = match users::Entity::find_by_id(user_id).one(&ctx_clone.db).await {
                        Ok(Some(u)) => u.name,
                        _ => "Usuário".to_string(),
                    };

                    let ws_msg = WsChatMessage {
                        id: msg_id,
                        service_request_id: req_id,
                        sender_id: user_id,
                        recipient_id,
                        sender_name,
                        content: incoming.content,
                        created_at: now.to_rfc3339(),
                    };

                    // Broadcast na sala do WebSocket
                    let _ = tx.send(ws_msg.clone());

                    // Disparar Push Notification
                    let db_clone = ctx_clone.db.clone();
                    let s_name = ws_msg.sender_name.clone();
                    let c_text = ws_msg.content.clone();

                    tokio::spawn(async move {
                        let target_uid = if let Some(target) = recipient_id {
                            Some(target)
                        } else if let Some(request_id) = req_id {
                            if let Ok(Some(req)) = crate::models::_entities::service_requests::Entity::find_by_id(request_id).one(&db_clone).await {
                                if req.client_id == user_id {
                                    if let Some(prof_profile_id) = req.professional_profile_id {
                                        if let Ok(Some(prof)) = crate::models::_entities::professional_profiles::Entity::find_by_id(prof_profile_id).one(&db_clone).await {
                                            Some(prof.user_id)
                                        } else { None }
                                    } else { None }
                                } else {
                                    Some(req.client_id)
                                }
                            } else { None }
                        } else { None };

                        if let Some(to_user) = target_uid {
                            let link = if recipient_id.is_some() {
                                format!("/chat/direct/{}", user_id)
                            } else {
                                format!("/chat/{}", req_id.unwrap())
                            };

                            crate::services::push::send_web_push(
                                &db_clone,
                                to_user,
                                &format!("💬 Nova mensagem de {}", s_name),
                                &c_text,
                                &link
                            ).await;
                        }
                    });
                }
            }
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/chat")
        .add("/{request_id}/messages", get(list_messages))
        .add("/{request_id}/ws", get(ws_handler))
        .add("/direct/{target_user_id}/messages", get(list_direct_messages))
        .add("/direct/{target_user_id}/ws", get(ws_direct_handler))
}
