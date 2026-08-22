use crate::models::_entities::{chat_messages, users};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query,
    },
    response::IntoResponse,
};
use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;

// Tipo de mensagem trafegada via WebSocket
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsChatMessage {
    pub id: uuid::Uuid,
    pub service_request_id: uuid::Uuid,
    pub sender_id: uuid::Uuid,
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

// Gerenciador global de salas de chat
type RoomChannels = Arc<Mutex<HashMap<uuid::Uuid, broadcast::Sender<WsChatMessage>>>>;

lazy_static::lazy_static! {
    static ref CHAT_ROOMS: RoomChannels = Arc::new(Mutex::new(HashMap::new()));
}

fn get_or_create_room(request_id: uuid::Uuid) -> broadcast::Sender<WsChatMessage> {
    let mut rooms = CHAT_ROOMS.lock().unwrap();
    rooms
        .entry(request_id)
        .or_insert_with(|| {
            let (tx, _) = broadcast::channel(100);
            tx
        })
        .clone()
}

// Rota HTTP REST para listar mensagens antigas de uma sala
#[debug_handler]
async fn list_messages(
    _auth: auth::JWT,
    State(ctx): State<AppContext>,
    Path(request_id): Path<uuid::Uuid>,
) -> Result<Response> {
    let messages = chat_messages::Entity::find()
        .filter(chat_messages::Column::ServiceRequestId.eq(request_id))
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
            sender_name,
            content: msg.content,
            created_at: msg.created_at.to_string(),
        });
    }

    format::json(dtos)
}

use futures_util::{SinkExt, StreamExt};

// Rota de Upgrade para WebSocket
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(request_id): Path<uuid::Uuid>,
    Query(query): Query<WsAuthQuery>,
    State(ctx): State<AppContext>,
) -> impl IntoResponse {
    let mut user_id = uuid::Uuid::nil();

    if let Some(token) = &query.token {
        let clean_token = token.trim_start_matches("Bearer ").trim();
        if let Some(auth_config) = &ctx.config.auth {
            if let Some(jwt_config) = &auth_config.jwt {
                if let Ok(claims) = loco_rs::auth::jwt::JWT::new(&jwt_config.secret).validate(clean_token) {
                    if let Ok(uid) = uuid::Uuid::parse_str(&claims.claims.pid) {
                        user_id = uid;
                    }
                }
            }
        }
    }

    tracing::info!("[WebSocket] Upgrade iniciado para a sala {} pelo usuário {}", request_id, user_id);

    ws.on_upgrade(move |socket| handle_socket(socket, request_id, user_id, ctx))
}

async fn handle_socket(
    socket: WebSocket,
    request_id: uuid::Uuid,
    user_id: uuid::Uuid,
    ctx: AppContext,
) {
    let tx = get_or_create_room(request_id);
    let mut rx = tx.subscribe();

    let (mut sender_ws, mut receiver_ws) = socket.split();

    // Task para escutar mensagens transmitidas no canal e mandar pro cliente WS
    let mut send_task = tokio::spawn(async move {
        use futures_util::SinkExt;
        while let Ok(msg) = rx.recv().await {
            if let Ok(json_str) = serde_json::to_string(&msg) {
                if sender_ws.send(Message::Text(json_str.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Task para ler mensagens recebidas do cliente WS e fazer broadcast + salvar no DB
    let ctx_clone = ctx.clone();
    let mut recv_task = tokio::spawn(async move {
        use futures_util::StreamExt;
        while let Some(Ok(msg)) = receiver_ws.next().await {
            if let Message::Text(text) = msg {
                if let Ok(incoming) = serde_json::from_str::<IncomingWsMessage>(&text) {
                    if incoming.content.trim().is_empty() {
                        continue;
                    }

                    let msg_id = uuid::Uuid::new_v4();
                    let now = chrono::Utc::now().naive_utc();

                    // Salvar no banco
                    let active_msg = chat_messages::ActiveModel {
                        id: Set(msg_id),
                        service_request_id: Set(request_id),
                        sender_id: Set(user_id),
                        content: Set(incoming.content.clone()),
                        created_at: Set(now),
                    };

                    let _ = active_msg.insert(&ctx_clone.db).await;

                    // Buscar nome do usuário
                    let sender_name = match users::Entity::find_by_id(user_id).one(&ctx_clone.db).await {
                        Ok(Some(u)) => u.name,
                        _ => "Usuário".to_string(),
                    };

                    let ws_msg = WsChatMessage {
                        id: msg_id,
                        service_request_id: request_id,
                        sender_id: user_id,
                        sender_name,
                        content: incoming.content,
                        created_at: now.to_string(),
                    };

                    // Broadcast para todos conectados na sala
                    let _ = tx.send(ws_msg);
                }
            }
        }
    });

    // Aguardar o encerramento de qualquer uma das tasks
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
}
