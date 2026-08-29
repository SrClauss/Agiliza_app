use loco_rs::prelude::*;
use sea_orm::EntityTrait;
use crate::models::_entities::{
    users, professional_profiles, service_requests, reviews, chat_messages,
    unlocked_contacts, featured_professionals, advertisements, favorites,
    availability_slots, portfolio_items, professional_profile_categories,
    quote_responses, service_categories
};

pub struct DbReset;

#[async_trait]
impl Task for DbReset {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "db_reset".to_string(),
            detail: "Restaura o banco de dados para o estado original limpo (apaga dados gerados e recria categorias padrão)".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!("GM Iniciando restauração do banco de dados para o estado original limpo...");

        // 1. Apagar todas as tabelas em ordem de chave estrangeira
        println!("🗑️ Limpando registros...");
        let _ = chat_messages::Entity::delete_many().exec(&ctx.db).await;
        let _ = reviews::Entity::delete_many().exec(&ctx.db).await;
        let _ = quote_responses::Entity::delete_many().exec(&ctx.db).await;
        let _ = unlocked_contacts::Entity::delete_many().exec(&ctx.db).await;
        let _ = service_requests::Entity::delete_many().exec(&ctx.db).await;
        let _ = featured_professionals::Entity::delete_many().exec(&ctx.db).await;
        let _ = professional_profile_categories::Entity::delete_many().exec(&ctx.db).await;
        let _ = portfolio_items::Entity::delete_many().exec(&ctx.db).await;
        let _ = availability_slots::Entity::delete_many().exec(&ctx.db).await;
        let _ = favorites::Entity::delete_many().exec(&ctx.db).await;
        let _ = advertisements::Entity::delete_many().exec(&ctx.db).await;
        let _ = professional_profiles::Entity::delete_many().exec(&ctx.db).await;
        let _ = users::Entity::delete_many().exec(&ctx.db).await;
        let _ = service_categories::Entity::delete_many().exec(&ctx.db).await;

        // 2. Recriar categorias básicas do sistema
        println!("✨ Recriando categorias originais...");
        let now: sea_orm::prelude::DateTimeWithTimeZone = chrono::Utc::now().into();
        let default_cats = vec![
            ("eletrica", "Elétrica", "Instalação, reparo e manutenção elétrica"),
            ("encanamento", "Encanamento", "Reparos de vazamentos, tubulações e desentupimento"),
            ("pintura", "Pintura", "Pintura residencial, comercial e texturas"),
            ("limpeza", "Limpeza", "Limpeza pós-obra, residencial e comercial"),
            ("reformas", "Reformas & Alvenaria", "Pequenas reformas, mestre de obras e estrutura"),
            ("instalacao-chuveiro", "Instalação de Chuveiro", "Instalação e troca de chuveiros e resistências"),
            ("troca-fiacao", "Troca de Fiação", "Substituição de fiação antiga e quadros de luz"),
            ("desentupimento", "Desentupimento", "Desentupimento de pias, ralos e vaso sanitário"),
        ];

        for (id, name, desc) in default_cats {
            let cat = service_categories::ActiveModel {
                id: sea_orm::Set(id.to_string()),
                name: sea_orm::Set(name.to_string()),
                slug: sea_orm::Set(id.to_string()),
                description: sea_orm::Set(Some(desc.to_string())),
                icon: sea_orm::Set(Some("tools".to_string())),
                is_active: sea_orm::Set(true),
                parent_id: sea_orm::Set(None),
                created_at: sea_orm::Set(now),
                updated_at: sea_orm::Set(now),
            };
            let _ = cat.insert(&ctx.db).await;
        }

        println!("✅ Banco de dados restaurado com sucesso para o estado original limpo!");
        Ok(())
    }
}
