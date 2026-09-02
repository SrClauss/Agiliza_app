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
            // (id, name, desc, parent_id, is_remote, is_physical)
            // Reparos & Construção
            ("reparos-construcao", "Reparos & Construção", "Obras, reformas e manutenções", None, false, true),
            ("eletrica", "Elétrica", "Instalações e reparos elétricos", Some("reparos-construcao"), false, true),
            ("encanamento", "Encanamento", "Vazamentos e instalações hidráulicas", Some("reparos-construcao"), false, true),
            ("pedreiro", "Pedreiro", "Alvenaria, reboco, pisos", Some("reparos-construcao"), false, true),
            
            // TI & Programação
            ("tecnologia", "Tecnologia & TI", "Serviços de informática e desenvolvimento", None, true, true),
            ("programacao", "Programação & Sistemas", "Desenvolvimento web, mobile e desktop", Some("tecnologia"), true, false),
            ("suporte-tecnico", "Suporte Técnico", "Formatação, redes e manutenção de PCs", Some("tecnologia"), true, true),

            // Consultoria & Jurídico
            ("consultoria-juridico", "Consultoria & Jurídico", "Advogados e contadores", None, true, true),
            ("direito-trabalhista", "Direito Trabalhista", "Assessoria trabalhista", Some("consultoria-juridico"), true, true),
            ("direito-civil", "Direito Civil & Família", "Inventários e divórcios", Some("consultoria-juridico"), true, true),
            ("contabilidade", "Contabilidade", "Imposto de renda e MEI", Some("consultoria-juridico"), true, true),

            // Saúde & Bem-estar
            ("saude-bem-estar", "Saúde & Bem-estar", "Profissionais de saúde e esportes", None, true, true),
            ("psicologia", "Psicologia & Terapia", "Atendimento individual e casal", Some("saude-bem-estar"), true, true),
            ("nutricao", "Nutrição", "Dietas e reeducação alimentar", Some("saude-bem-estar"), true, true),
            ("personal-trainer", "Personal Trainer", "Treinos online e presenciais", Some("saude-bem-estar"), true, true),

            // Marketing & Design
            ("marketing-design", "Marketing & Design", "Criação visual e marketing digital", None, true, false),
            ("design-grafico", "Design Gráfico", "Logos, banners e identidade", Some("marketing-design"), true, false),
            ("marketing-digital", "Marketing Digital", "Gestão de tráfego e redes", Some("marketing-design"), true, false),

            // Aulas & Educação
            ("aulas-educacao", "Aulas & Educação", "Professores particulares e tutores", None, true, true),
            ("aulas-particulares", "Aulas Particulares", "Reforço escolar", Some("aulas-educacao"), true, true),
            ("idiomas", "Idiomas", "Aulas de Inglês, Espanhol, etc", Some("aulas-educacao"), true, true),

            // Estética & Beleza
            ("estetica-beleza", "Estética & Beleza", "Cabelo, maquiagem e unhas", None, false, true),
            ("cabelereiro", "Cabelereiro(a)", "Cortes e penteados", Some("estetica-beleza"), false, true),
            ("manicure", "Manicure/Pedicure", "Unhas decoradas", Some("estetica-beleza"), false, true),

            // Limpeza
            ("limpeza", "Limpeza", "Serviços domésticos e corporativos", None, false, true),
            ("diarista", "Diarista/Faxina", "Limpeza residencial", Some("limpeza"), false, true),
            ("pos-obra", "Limpeza Pós-Obra", "Limpeza pesada", Some("limpeza"), false, true),

            // Eventos
            ("eventos", "Eventos & Festas", "Buffet, fotografia, animação", None, false, true),
            ("fotografia", "Fotografia", "Ensaios e cobertura de eventos", Some("eventos"), false, true),
            ("dj", "DJ/Música", "Som para festas", Some("eventos"), false, true),
        ];

        for (id, name, desc, parent_id, is_remote, is_physical) in default_cats {
            let cat = service_categories::ActiveModel {
                id: sea_orm::Set(id.to_string()),
                name: sea_orm::Set(name.to_string()),
                slug: sea_orm::Set(id.to_string()),
                description: sea_orm::Set(Some(desc.to_string())),
                icon: sea_orm::Set(Some("tools".to_string())),
                is_active: sea_orm::Set(true),
                parent_id: sea_orm::Set(parent_id.map(|s| s.to_string())),
                is_remote: sea_orm::Set(is_remote),
                is_physical: sea_orm::Set(is_physical),
                created_at: sea_orm::Set(now),
                updated_at: sea_orm::Set(now),
            };
            let _ = cat.insert(&ctx.db).await;
        }

        println!("✅ Banco de dados restaurado com sucesso para o estado original limpo!");
        Ok(())
    }
}
