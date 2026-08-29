use loco_rs::{prelude::*, hash};
use sea_orm::{ActiveModelTrait, EntityTrait, Set, ColumnTrait, QueryFilter};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{Utc, Duration};
use crate::models::_entities::{
    users, professional_profiles, service_requests, reviews, chat_messages, unlocked_contacts
};
use crate::tasks::recalculate_featured::RecalculateFeatured;

pub struct SeedComplete;

#[async_trait]
impl Task for SeedComplete {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_complete".to_string(),
            detail: "Gera banco completo com fluxo completo de serviços (OPEN, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED), chat direto e ligação não-finalizada entre pro1 e cliente1".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!("🚀 Iniciando Seed Completo (Fluxo de Serviços, Chat Direto, Conexão Ativa pro1 ↔ cliente1 e 50 Pros)...");

        let password_hash = hash::hash_password("123456")?;
        let now: sea_orm::prelude::DateTimeWithTimeZone = Utc::now().into();

        // 1. Criar Usuário Pro1 (Marcos Oliveira) e Cliente1 (Ana Maria)
        println!("👤 Criando Usuários Principais de Teste (pro1 e cliente1)...");
        let pro1_user_id = if let Some(u) = users::Entity::find().filter(users::Column::Email.eq("pro1@example.com")).one(&ctx.db).await? {
            u.id
        } else {
            let uid = Uuid::new_v4();
            let u = users::ActiveModel {
                id: Set(uid),
                email: Set("pro1@example.com".to_string()),
                password: Set(password_hash.clone()),
                name: Set("Marcos Oliveira".to_string()),
                api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                role: Set(Some("PROFESSIONAL".to_string())),
                is_staff: Set(Some(false)),
                is_verified: Set(Some(true)),
                is_active: Set(Some(true)),
                is_blocked: Set(Some(false)),
                cpf: Set(Some("111.222.333-44".to_string())),
                created_at: Set(now),
                updated_at: Set(now),
                ..Default::default()
            };
            u.insert(&ctx.db).await?;
            uid
        };

        let pro1_profile_id = if let Some(p) = professional_profiles::Entity::find().filter(professional_profiles::Column::UserId.eq(pro1_user_id)).one(&ctx.db).await? {
            p.id
        } else {
            let pid = Uuid::new_v4();
            let p = professional_profiles::ActiveModel {
                id: Set(pid),
                user_id: Set(pro1_user_id),
                bio: Set(Some("Eletricista Residencial e Comercial 24 Horas. Especialista em automação e disjuntores.".to_string())),
                years_experience: Set(10),
                hourly_rate: Set(Decimal::new(8000, 2)),
                service_radius_km: Set(35),
                address: Set(Some("São Paulo, SP".to_string())),
                average_rating: Set(Decimal::new(490, 2)),
                total_reviews: Set(45),
                subscription_status: Set("ACTIVE".to_string()),
                subscription_plan: Set("pro".to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                ..Default::default()
            };
            p.insert(&ctx.db).await?;
            pid
        };

        let cliente1_user_id = if let Some(u) = users::Entity::find().filter(users::Column::Email.eq("cliente1@example.com")).one(&ctx.db).await? {
            u.id
        } else {
            let uid = Uuid::new_v4();
            let u = users::ActiveModel {
                id: Set(uid),
                email: Set("cliente1@example.com".to_string()),
                password: Set(password_hash.clone()),
                name: Set("Ana Maria Cliente".to_string()),
                api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                role: Set(Some("CLIENT".to_string())),
                is_staff: Set(Some(false)),
                is_verified: Set(Some(true)),
                is_active: Set(Some(true)),
                is_blocked: Set(Some(false)),
                cpf: Set(Some("555.666.777-88".to_string())),
                created_at: Set(now),
                updated_at: Set(now),
                ..Default::default()
            };
            u.insert(&ctx.db).await?;
            uid
        };

        // 2. Criar Ligação Não-Finalizada (Em Andamento) entre pro1 e cliente1
        println!("🔗 Criando Ligação Ativa Não-Finalizada (ACCEPTED) entre pro1 e cliente1...");
        let existing_req = service_requests::Entity::find()
            .filter(service_requests::Column::ClientId.eq(cliente1_user_id))
            .filter(service_requests::Column::Title.eq("Instalação de Quadro Elétrico & Chuveiro Pressurizado"))
            .one(&ctx.db)
            .await?;

        let active_request_id = if let Some(req) = existing_req {
            req.id
        } else {
            let req_id = Uuid::new_v4();
            let active_req = service_requests::ActiveModel {
                id: Set(req_id),
                client_id: Set(cliente1_user_id),
                professional_profile_id: Set(Some(pro1_profile_id)),
                service_category_id: Set(Some("eletrica".to_string())),
                title: Set("Instalação de Quadro Elétrico & Chuveiro Pressurizado".to_string()),
                description: Set("Preciso trocar o disjuntor principal da cozinha e instalar um chuveiro novo Lorenzetti de 7500W com fiação dedicada.".to_string()),
                status: Set("ACCEPTED".to_string()),
                address: Set(Some("Rua das Flores, 123 - Apt 42, São Paulo - SP".to_string())),
                quoted_price: Set(Some(Decimal::new(18000, 2))),
                requested_date: Set(Some(now)),
                scheduled_date: Set(Some(now)),
                created_at: Set((Utc::now() - Duration::hours(2)).into()),
                updated_at: Set(now),
                ..Default::default()
            };
            active_req.insert(&ctx.db).await?;
            req_id
        };

        // Desbloquear contato entre pro1 e cliente1
        let unlock = unlocked_contacts::ActiveModel {
            professional_profile_id: Set(pro1_profile_id),
            client_id: Set(cliente1_user_id),
            service_request_id: Set(Some(active_request_id)),
            created_at: Set(Utc::now()),
            updated_at: Set(Utc::now()),
            ..Default::default()
        };
        let _ = unlock.insert(&ctx.db).await;

        // Criar Histórico de Conversa em Tempo Real no Chat entre cliente1 e pro1
        println!("💬 Gerando Mensagens de Chat Ativas entre pro1 e cliente1...");
        let messages_data = vec![
            (cliente1_user_id, pro1_user_id, "Olá Marcos! Preciso de ajuda para instalar um chuveiro novo e trocar o disjuntor do quadro da cozinha."),
            (pro1_user_id, cliente1_user_id, "Olá Ana! Perfeito, posso realizar a instalação hoje às 14h. O valor do serviço fica em R$ 180,00."),
            (cliente1_user_id, pro1_user_id, "Ótimo, orçamento aprovado! Te aguardo aqui no endereço às 14h."),
            (pro1_user_id, cliente1_user_id, "Combinado, Ana! Já organizei o material e estou a caminho com os equipamentos de medição."),
        ];

        for (idx, (sender, recipient, text)) in messages_data.into_iter().enumerate() {
            let msg = chat_messages::ActiveModel {
                id: Set(Uuid::new_v4()),
                service_request_id: Set(Some(active_request_id)),
                sender_id: Set(sender),
                recipient_id: Set(Some(recipient)),
                content: Set(text.to_string()),
                created_at: Set((Utc::now() - Duration::minutes((30 - idx * 5) as i64)).into()),
            };
            let _ = msg.insert(&ctx.db).await;
        }

        // 3. Criar Pedidos em Todas as Fases do Fluxo (OPEN, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
        println!("🔄 Criando Pedidos em TODAS as fases do fluxo (OPEN, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)...");
        let flow_requests = vec![
            ("OPEN", "Troca de Fiação Antiga em Sobrado", "eletrica", None, None),
            ("ACCEPTED", "Reparo Hidráulico e Desentupimento 24h", "encanamento", Some(pro1_profile_id), Some(Decimal::new(22000, 2))),
            ("IN_PROGRESS", "Pintura Interna de Sala e Corredor", "pintura", Some(pro1_profile_id), Some(Decimal::new(45000, 2))),
            ("COMPLETED", "Instalação de Lustre e Tomadas LED", "eletrica", Some(pro1_profile_id), Some(Decimal::new(12000, 2))),
            ("CANCELLED", "Reforma de Parede com Umidade", "reformas", None, None),
        ];

        for (status, title, cat_id, prof_id, price) in flow_requests {
            let req_id = Uuid::new_v4();
            let req = service_requests::ActiveModel {
                id: Set(req_id),
                client_id: Set(cliente1_user_id),
                professional_profile_id: Set(prof_id),
                service_category_id: Set(Some(cat_id.to_string())),
                title: Set(title.to_string()),
                description: Set(format!("Pedido de teste para verificação do estado '{}' no fluxo de atendimento.", status)),
                status: Set(status.to_string()),
                address: Set(Some("Av. Paulista, 1000 - São Paulo, SP".to_string())),
                quoted_price: Set(price),
                created_at: Set((Utc::now() - Duration::days(3)).into()),
                updated_at: Set(now),
                completed_at: Set(if status == "COMPLETED" { Some(now) } else { None }),
                cancelled_at: Set(if status == "CANCELLED" { Some(now) } else { None }),
                ..Default::default()
            };
            req.insert(&ctx.db).await?;

            // Se finalizado, adicionar avaliação de 5 estrelas
            if status == "COMPLETED" && prof_id.is_some() {
                let rev = reviews::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    client_id: Set(cliente1_user_id),
                    professional_profile_id: Set(prof_id.unwrap()),
                    rating: Set(5),
                    comment: Set(Some("Serviço impecável! Pontual, organizado e muito profissional.".to_string())),
                    created_at: Set(now),
                    updated_at: Set(now),
                };
                let _ = rev.insert(&ctx.db).await;
            }
        }

        // 4. Executar Seed Massivo para ter 50 Profissionais e 500 Clientes
        println!("🌱 Executando carga de dados massivos de apoio...");
        let seed_massive_task = crate::tasks::seed_massive::SeedMassive;
        let _ = seed_massive_task.run(ctx, _vars).await;

        // 5. Recalcular Destacados
        RecalculateFeatured.run(ctx, _vars).await?;

        println!("🎉 Seed Completo Concluído com Sucesso!");
        println!("✨ Destaques do Seed:");
        println!("   - pro1@example.com (Marcos Oliveira) e cliente1@example.com (Ana Maria) com login 123456");
        println!("   - Pedido Ativo 'ACCEPTED' e 4 Mensagens de Chat Direto entre pro1 e cliente1");
        println!("   - Pedidos criados para TODOS os estados: OPEN, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED");
        
        Ok(())
    }
}
