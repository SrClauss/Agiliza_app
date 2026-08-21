use loco_rs::{prelude::*, hash};
use sea_orm::{ActiveModelTrait, EntityTrait, Set};
use uuid::Uuid;
use chrono::{Utc, Duration};
use crate::models::_entities::{
    users, professional_profiles, service_categories, subscription_plans, service_requests
};

pub struct SeedData;
#[async_trait]
impl Task for SeedData {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_data".to_string(),
            detail: "Popula banco de dados com dados iniciais e admin".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!("🌱 Populando banco de dados básico...");

        // 1. Planos
        let plans = vec![
            ("free", "Grátis", 0, 5, None, r#"["Até 5 contatos/mês", "Perfil básico no catálogo"]"#),
            ("pro", "Agiliza Pro", 2990, 20, Some("price_1U6TgbLTtCtvRRHBjbPo5XbI"), r#"["Até 20 contatos/mês", "Selo de Profissional Verificado", "Notificação em tempo real"]"#),
            ("premium", "Agiliza Premium", 4990, 999999, Some("price_1U6TgcLTtCtvRRHBPoFgenQ0"), r#"["Desbloqueios ilimitados", "Selo Premium no topo", "Suporte prioritário 24/7"]"#),
        ];

        for (id, name, price, limit, stripe_id, feats) in plans {
            if subscription_plans::Entity::find_by_id(id).one(&ctx.db).await?.is_none() {
                let plan = subscription_plans::ActiveModel {
                    id: Set(id.to_string()),
                    name: Set(name.to_string()),
                    price_cents: Set(price),
                    monthly_unlock_limit: Set(limit),
                    stripe_price_id: Set(stripe_id.map(|s| s.to_string())),
                    features: Set(Some(feats.to_string())),
                    is_active: Set(true),
                    ..Default::default()
                };
                plan.insert(&ctx.db).await?;
            }
        }

        // 2. Categorias
        let categories_data = vec![
            ("eletrica", "Elétrica", "eletrica", "⚡", "Serviços elétricos em geral", None),
            ("instalacao-chuveiro", "Instalação de Chuveiro", "instalacao-chuveiro", "🚿", "Instalação e reparo de chuveiros elétricos", Some("eletrica")),
            ("troca-fiacao", "Troca de Fiação", "troca-fiacao", "🔌", "Manutenção e substituição de fiação residencial", Some("eletrica")),
            ("encanamento", "Encanamento", "encanamento", "💧", "Reparos hidráulicos e desentupimentos", None),
            ("desentupimento", "Desentupimento", "desentupimento", "🪠", "Desentupimento de pias, ralos e vasos", Some("encanamento")),
            ("pintura", "Pintura", "pintura", "🎨", "Pintura residencial e comercial", None),
            ("limpeza", "Limpeza", "limpeza", "🧹", "Faxina e limpeza pós-obra", None),
            ("reformas", "Reformas", "reformas", "🔨", "Pequenas reformas e alvenaria", None),
        ];

        for (id, name, slug, icon, desc, parent) in categories_data {
            if service_categories::Entity::find_by_id(id).one(&ctx.db).await?.is_none() {
                let cat = service_categories::ActiveModel {
                    id: Set(id.to_string()),
                    name: Set(name.to_string()),
                    slug: Set(slug.to_string()),
                    icon: Set(Some(icon.to_string())),
                    description: Set(Some(desc.to_string())),
                    is_active: Set(true),
                    parent_id: Set(parent.map(|p| p.to_string())),
                    ..Default::default()
                };
                cat.insert(&ctx.db).await?;
            }
        }

        // 3. Admin
        let admin_email = "admin@agilizapro.com.br";
        if users::Entity::find().filter(users::Column::Email.eq(admin_email)).one(&ctx.db).await?.is_none() {
            let password_hash = hash::hash_password("admin123")?;
            let user = users::ActiveModel {
                id: Set(Uuid::new_v4()),
                email: Set(admin_email.to_string()),
                password: Set(password_hash),
                name: Set("Administrador AgilizaPro".to_string()),
                api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                role: Set(Some("ADMIN".to_string())),
                is_staff: Set(Some(true)),
                is_verified: Set(Some(true)),
                is_active: Set(Some(true)),
                is_blocked: Set(Some(false)),
                cpf: Set(Some("000.000.000-00".to_string())),
                ..Default::default()
            };
            user.insert(&ctx.db).await?;
        }

        println!("✅ Seed Rust Básico Concluído!");
        Ok(())
    }
}
