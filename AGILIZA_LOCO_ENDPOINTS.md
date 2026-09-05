# 🚀 Documentação de Endpoints da API - `agiliza_loco`

Este documento contém o catálogo completo dos endpoints REST e WebSocket do backend **`agiliza_loco`** (desenvolvido em Rust utilizando o framework Loco.rs).

---

## 🔑 1. Autenticação & Conta (`/api/auth`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Registro de novo usuário (Cliente ou Profissional) | ❌ Não |
| `POST` | `/api/auth/login` | Login com e-mail e senha (retorna JWT) | ❌ Não |
| `GET` | `/api/auth/verify/{token}` | Verificação de e-mail por token | ❌ Não |
| `POST` | `/api/auth/forgot` | Solicitar e-mail de redefinição de senha | ❌ Não |
| `POST` | `/api/auth/reset` | Redefinir senha informando o token recebido | ❌ Não |
| `GET` | `/api/auth/current` | Retorna os dados do usuário autenticado no momento | ✅ Sim |
| `POST` | `/api/auth/magic-link` | Enviar link mágico de acesso rápido por e-mail | ❌ Não |
| `GET` | `/api/auth/magic-link/{token}` | Validar token do link mágico e efetuar login | ❌ Não |
| `POST` | `/api/auth/onboarding` | Completar cadastro inicial / CPF e perfil | ✅ Sim |
| `POST` | `/api/auth/resend-verification-mail` | Reenviar e-mail de confirmação de conta | ❌ Não |

---

## 🌐 2. Autenticação Social (`/api/auth/social`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/social/google` | Autenticação / Cadastro rápido via Google OAuth (ID Token) | ❌ Não |

---

## 📲 3. Push Notifications & Tokens de Dispositivo (`/api/device_tokens`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/device_tokens` | Registrar subscription de WebPush ou FCM Token de celular | ✅ Sim |

---

## 👨‍🔧 4. Perfis de Profissionais (`/api/auth/professionals`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/auth/professionals` | Listar catálogo de profissionais com filtros de busca/categoria | ❌ Não |
| `GET` | `/api/auth/professionals/featured` | Listar profissionais em destaque | ❌ Não |
| `GET` | `/api/auth/professionals/me` | Obter meu perfil profissional | ✅ Sim |
| `PUT` | `/api/auth/professionals/me` | Atualizar meu perfil profissional (bio, categorias, preço hora, etc) | ✅ Sim |
| `GET` | `/api/auth/professionals/me/reviews` | Listar todas as avaliações recebidas pelo meu perfil | ✅ Sim |
| `GET` | `/api/auth/professionals/me/limits` | Obter limites mensais de desbloqueio de contatos do meu plano | ✅ Sim |

---

## 🖼️ 5. Portfólio do Profissional (`/api/auth/portfolio`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/auth/portfolio` | Listar itens do portfólio do profissional | ✅ Sim |
| `POST` | `/api/auth/portfolio` | Adicionar novo projeto/foto ao portfólio | ✅ Sim |
| `DELETE` | `/api/auth/portfolio/{id}` | Remover item do portfólio | ✅ Sim |

---

## 📅 6. Grade de Horários / Disponibilidade (`/api/auth/availability-slots`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/auth/availability-slots` | Listar horários de atendimento cadastrados | ✅ Sim |
| `POST` | `/api/auth/availability-slots` | Adicionar novo slot de disponibilidade semanal | ✅ Sim |
| `DELETE` | `/api/auth/availability-slots/{id}` | Remover slot de disponibilidade | ✅ Sim |

---

## ⭐ 7. Favoritos (`/api/auth/favorites`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/auth/favorites` | Listar profissionais favoritados pelo cliente | ✅ Sim |
| `POST` | `/api/auth/favorites` | Adicionar profissional aos favoritos | ✅ Sim |
| `DELETE` | `/api/auth/favorites/{id}` | Remover profissional dos favoritos | ✅ Sim |

---

## 🌟 8. Avaliações & Ratings (`/api/reviews`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/reviews` | Listar avaliações (filtro por profissional) | ❌ Não |
| `POST` | `/api/reviews` | Criar nova avaliação para um atendimento concluído | ✅ Sim |
| `DELETE` | `/api/reviews/{id}` | Remover uma avaliação enviada | ✅ Sim |

---

## 🏷️ 9. Categorias de Serviços (`/api/categories`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/categories` | Listar categorias e subcategorias ativas com flags `is_remote`/`is_physical` | ❌ Não |

---

## 📋 10. Pedidos de Serviços (`/api/services/requests`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/services/requests` | Listar pedidos (filtro por status, paginação, modo remoto/presencial) | ✅ Sim |
| `POST` | `/api/services/requests` | Criar um novo pedido de serviço (suporta flag `is_remote`) | ✅ Sim |
| `GET` | `/api/services/requests/{id}` | Obter detalhes completos de um pedido específico | ✅ Sim |
| `POST` | `/api/services/requests/{id}/status` | Atualizar status do pedido (`ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) | ✅ Sim |
| `POST` | `/api/services/requests/{id}/unlock` | Desbloquear dados de contato do cliente (consome crédito do plano) | ✅ Sim |

---

## 💰 11. Propostas / Orçamentos (`/api/services/quotes`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/services/quotes` | Listar propostas/orçamentos recebidos ou enviados | ✅ Sim |
| `POST` | `/api/services/quotes` | Enviar uma proposta com preço e prazo para um pedido | ✅ Sim |

---

## 💬 12. Chat & Comunicação em Tempo Real (`/api/chat`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/chat/{request_id}/messages` | Histórico de mensagens do chat vinculado a um pedido | ✅ Sim |
| `POST` | `/api/chat/{request_id}/messages` | Enviar mensagem no chat do pedido | ✅ Sim |
| `GET` | `/api/chat/{request_id}/ws` | **WebSocket**: Conexão em tempo real do chat do pedido | ✅ Sim |
| `GET` | `/api/chat/direct/{target_user_id}/messages` | Histórico de mensagens de chat direto entre usuários | ✅ Sim |
| `POST` | `/api/chat/direct/{target_user_id}/messages` | Enviar mensagem em chat direto | ✅ Sim |
| `GET` | `/api/chat/direct/{target_user_id}/ws` | **WebSocket**: Conexão em tempo real de chat direto | ✅ Sim |

---

## 💳 13. Assinaturas & Planos Stripe (`/api/billing`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/billing/plans` | Listar planos de assinatura ativos (`Grátis`, `Pro`, `Premium`) | ❌ Não |
| `POST` | `/api/billing/create-checkout-session` | Criar sessão de Checkout Stripe para assinatura de plano Pro/Premium | ✅ Sim |
| `POST` | `/api/billing/webhook` | Webhook interno para processar eventos do Stripe | ❌ Não |

---

## 📢 14. Banners Promocionais & Publicidade (`/api/advertisements`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/advertisements` | Listar banners de anúncios ativos para exibição na home | ❌ Não |
| `POST` | `/api/advertisements` | Criar novo banner patrocinado | ✅ Sim |
| `GET` | `/api/advertisements/admin/all` | Listar todos os anúncios (Painel Admin) | ✅ Admin |
| `PUT` | `/api/advertisements/admin/{ad_id}/status` | Aprovar, ativar ou pausar anúncio | ✅ Admin |
| `DELETE` | `/api/advertisements/admin/{ad_id}` | Excluir anúncio | ✅ Admin |

---

## 🛠️ 15. Painel Administrativo (`/api/admin`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/admin/plans` | Listar planos de assinatura no admin | ✅ Admin |
| `POST` | `/api/admin/plans` | Criar ou atualizar plano de assinatura | ✅ Admin |
| `GET` | `/api/admin/categories` | Listar categorias no admin | ✅ Admin |
| `POST` | `/api/admin/categories` | Criar/editar categoria ou alterar `is_remote`/`is_physical` | ✅ Admin |
| `GET` | `/api/admin/users` | Listar todos os usuários cadastrados no sistema | ✅ Admin |
| `POST` | `/api/admin/users/{id}/block` | Bloquear conta de usuário por infração | ✅ Admin |
| `POST` | `/api/admin/users/{id}/unblock` | Desbloquear conta de usuário | ✅ Admin |
| `POST` | `/api/admin/users/{id}/grant-plan` | Conceder plano de assinatura manualmente a um parceiro | ✅ Admin |
| `GET` | `/api/admin/stats/financial` | Estatísticas financeiras da plataforma | ✅ Admin |
| `GET` | `/api/admin/stats/services` | Métricas de pedidos e atendimentos da plataforma | ✅ Admin |
| `POST` | `/api/admin/staff/invite` | Gerar token de convite para novo administrador | ✅ Admin |
| `POST` | `/api/admin/staff/register` | Registrar conta admin utilizando o token de convite | ❌ Não |

---

## 🔔 16. Webhooks de Pagamento (`/api/webhooks`)

| Método | Endpoint | Descrição | Requer Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/webhooks/stripe` | Endpoint público para recebimento de webhooks do Stripe | ❌ Não |
