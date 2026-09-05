use loco_rs::{prelude::*, hash};
use sea_orm::{ActiveModelTrait, EntityTrait, Set, ColumnTrait, QueryFilter, PaginatorTrait};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{Utc, Duration};
use crate::models::_entities::{
    users, professional_profiles, service_categories, subscription_plans, advertisements
};

pub struct SeedData;
#[async_trait]
impl Task for SeedData {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_data".to_string(),
            detail: "Popula banco de dados com dados iniciais, admin, múltiplos profissionais em destaque e banners patrocinados".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!("🌱 Populando e atualizando banco de dados básico...");

        let default_password_hash = hash::hash_password("123456")?;
        let admin_password_hash = hash::hash_password("admin123")?;
        let now: sea_orm::prelude::DateTimeWithTimeZone = Utc::now().into();

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
                    created_at: Set(now),
                    updated_at: Set(now),
                };
                plan.insert(&ctx.db).await?;
            }
        }

        // 2. Categorias
        let categories_data = vec![
            // (id, name, slug, icon, desc, parent, is_remote, is_physical)
            ("reparos-construcao", "Reparos & Construção", "reparos-construcao", "🔨", "Obras, reformas e manutenções", None, false, true),
            ("eletrica", "Elétrica", "eletrica", "⚡", "Instalações e reparos elétricos", Some("reparos-construcao"), false, true),
            ("encanamento", "Encanamento", "encanamento", "💧", "Vazamentos e instalações hidráulicas", Some("reparos-construcao"), false, true),
            ("pedreiro", "Pedreiro", "pedreiro", "🧱", "Alvenaria, reboco, pisos", Some("reparos-construcao"), false, true),
            
            ("tecnologia", "Tecnologia & TI", "tecnologia", "💻", "Serviços de informática e desenvolvimento", None, true, true),
            ("programacao", "Programação & Sistemas", "programacao", "💻", "Desenvolvimento web, mobile e desktop", Some("tecnologia"), true, false),
            ("suporte-tecnico", "Suporte Técnico", "suporte-tecnico", "🖥️", "Formatação, redes e manutenção de PCs", Some("tecnologia"), true, true),

            ("consultoria-juridico", "Consultoria & Jurídico", "consultoria-juridico", "⚖️", "Advogados e contadores", None, true, true),
            ("direito-trabalhista", "Direito Trabalhista", "direito-trabalhista", "📜", "Assessoria trabalhista", Some("consultoria-juridico"), true, true),
            ("direito-civil", "Direito Civil & Família", "direito-civil", "🏛️", "Inventários e divórcios", Some("consultoria-juridico"), true, true),
            ("contabilidade", "Contabilidade", "contabilidade", "📊", "Imposto de renda e MEI", Some("consultoria-juridico"), true, true),

            ("saude-bem-estar", "Saúde & Bem-estar", "saude-bem-estar", "⚕️", "Profissionais de saúde e esportes", None, true, true),
            ("psicologia", "Psicologia & Terapia", "psicologia", "🧠", "Atendimento individual e casal", Some("saude-bem-estar"), true, true),
            ("nutricao", "Nutrição", "nutricao", "🥗", "Dietas e reeducação alimentar", Some("saude-bem-estar"), true, true),
            ("personal-trainer", "Personal Trainer", "personal-trainer", "🏋️", "Treinos online e presenciais", Some("saude-bem-estar"), true, true),

            ("marketing-design", "Marketing & Design", "marketing-design", "🎨", "Criação visual e marketing digital", None, true, false),
            ("design-grafico", "Design Gráfico", "design-grafico", "🎨", "Logos, banners e identidade", Some("marketing-design"), true, false),
            ("marketing-digital", "Marketing Digital", "marketing-digital", "📈", "Gestão de tráfego e redes", Some("marketing-design"), true, false),

            ("aulas-educacao", "Aulas & Educação", "aulas-educacao", "📚", "Professores particulares e tutores", None, true, true),
            ("aulas-particulares", "Aulas Particulares", "aulas-particulares", "📚", "Reforço escolar", Some("aulas-educacao"), true, true),
            ("idiomas", "Idiomas", "idiomas", "🗣️", "Aulas de Inglês, Espanhol, etc", Some("aulas-educacao"), true, true),

            ("estetica-beleza", "Estética & Beleza", "estetica-beleza", "💇", "Cabelo, maquiagem e unhas", None, false, true),
            ("cabelereiro", "Cabelereiro(a)", "cabelereiro", "💇", "Cortes e penteados", Some("estetica-beleza"), false, true),
            ("manicure", "Manicure/Pedicure", "manicure", "💅", "Unhas decoradas", Some("estetica-beleza"), false, true),

            ("limpeza", "Limpeza", "limpeza", "🧹", "Serviços domésticos e corporativos", None, false, true),
            ("diarista", "Diarista/Faxina", "diarista", "🧹", "Limpeza residencial", Some("limpeza"), false, true),
            ("pos-obra", "Limpeza Pós-Obra", "pos-obra", "🧹", "Limpeza pesada", Some("limpeza"), false, true),

            ("eventos", "Eventos & Festas", "eventos", "🎉", "Buffet, fotografia, animação", None, false, true),
            ("fotografia", "Fotografia", "fotografia", "📸", "Ensaios e cobertura de eventos", Some("eventos"), false, true),
            ("dj", "DJ/Música", "dj", "🎧", "Som para festas", Some("eventos"), false, true),
        ];

        for (id, name, slug, icon, desc, parent, is_remote, is_physical) in categories_data {
            if let Some(existing) = service_categories::Entity::find_by_id(id).one(&ctx.db).await? {
                let mut active: service_categories::ActiveModel = existing.into();
                active.is_remote = Set(is_remote);
                active.is_physical = Set(is_physical);
                active.updated_at = Set(now);
                active.update(&ctx.db).await?;
            } else {
                let cat = service_categories::ActiveModel {
                    id: Set(id.to_string()),
                    name: Set(name.to_string()),
                    slug: Set(slug.to_string()),
                    icon: Set(Some(icon.to_string())),
                    description: Set(Some(desc.to_string())),
                    is_active: Set(true),
                    parent_id: Set(parent.map(|p| p.to_string())),
                    is_remote: Set(is_remote),
                    is_physical: Set(is_physical),
                    created_at: Set(now),
                    updated_at: Set(now),
                };
                cat.insert(&ctx.db).await?;
            }
        }

        // 3. Admin
        let admin_email = "admin@agilizapro.com.br";
        if let Some(existing_admin) = users::Entity::find().filter(users::Column::Email.eq(admin_email)).one(&ctx.db).await? {
            let mut active: users::ActiveModel = existing_admin.into();
            active.password = Set(admin_password_hash.clone());
            active.updated_at = Set(now);
            active.update(&ctx.db).await?;
        } else {
            let user = users::ActiveModel {
                id: Set(Uuid::new_v4()),
                email: Set(admin_email.to_string()),
                password: Set(admin_password_hash),
                name: Set("Administrador AgilizaPro".to_string()),
                api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                is_staff: Set(Some(true)),
                is_verified: Set(Some(true)),
                is_active: Set(Some(true)),
                is_blocked: Set(Some(false)),
                cpf: Set(Some("000.000.000-00".to_string())),
                created_at: Set(now),
                updated_at: Set(now),
                ..Default::default()
            };
            user.insert(&ctx.db).await?;
        }

        // 4. Usuário Cliente de Teste (cliente1@example.com)
        let client_email = "cliente1@example.com";
        if let Some(existing_client) = users::Entity::find().filter(users::Column::Email.eq(client_email)).one(&ctx.db).await? {
            let mut active: users::ActiveModel = existing_client.into();
            active.password = Set(default_password_hash.clone());
            active.updated_at = Set(now);
            active.update(&ctx.db).await?;
        } else {
            let user = users::ActiveModel {
                id: Set(Uuid::new_v4()),
                email: Set(client_email.to_string()),
                password: Set(default_password_hash.clone()),
                name: Set("Cliente de Teste".to_string()),
                api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                is_staff: Set(Some(false)),
                is_verified: Set(Some(true)),
                is_active: Set(Some(true)),
                is_blocked: Set(Some(false)),
                cpf: Set(Some("111.111.111-11".to_string())),
                created_at: Set(now),
                updated_at: Set(now),
                ..Default::default()
            };
            user.insert(&ctx.db).await?;
            println!("👤 Usuário cliente1@example.com criado/atualizado com sucesso!");
        }

        // 5. Múltiplos Profissionais em Destaque (pro1 a pro6)
        let pros_data = vec![
            ("pro1@example.com", "Marcos Oliveira", "Eletricista Residencial & Comercial", 8, 8500, 500, 24, "São Paulo, SP"),
            ("pro2@example.com", "Roberto Silva", "Encanador & Mestre em Hidráulica", 10, 9000, 490, 32, "São Paulo, SP"),
            ("pro3@example.com", "Carlos Eduardo", "Pintor Profissional & Texturas", 6, 7500, 485, 19, "São Paulo, SP"),
            ("pro4@example.com", "Fernando Souza", "Mestre de Obras & Reformas", 12, 12000, 500, 45, "São Paulo, SP"),
            ("pro5@example.com", "Amanda Costa", "Especialista em Limpeza Pós-Obra", 5, 7000, 495, 28, "São Paulo, SP"),
            ("pro6@example.com", "Lucas Mendes", "Técnico em Ar Condicionado & Refrigeração", 7, 9500, 480, 16, "São Paulo, SP"),
        ];

        let mut primary_pro_user_id = Uuid::nil();

        for (email, name, bio, exp, rate, rating, reviews, addr) in pros_data {
            let uid = if let Some(existing) = users::Entity::find().filter(users::Column::Email.eq(email)).one(&ctx.db).await? {
                let mut active: users::ActiveModel = existing.clone().into();
                active.name = Set(name.to_string());
                active.password = Set(default_password_hash.clone());
                active.updated_at = Set(now);
                active.update(&ctx.db).await?;
                existing.id
            } else {
                let new_id = Uuid::new_v4();
                let user = users::ActiveModel {
                    id: Set(new_id),
                    email: Set(email.to_string()),
                    password: Set(default_password_hash.clone()),
                    name: Set(name.to_string()),
                    api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                    is_staff: Set(Some(false)),
                    is_verified: Set(Some(true)),
                    is_active: Set(Some(true)),
                    is_blocked: Set(Some(false)),
                    cpf: Set(Some("222.222.222-22".to_string())),
                    created_at: Set(now),
                    updated_at: Set(now),
                    ..Default::default()
                };
                user.insert(&ctx.db).await?;
                println!("🛠️ Profissional {} ({}) criado!", name, email);
                new_id
            };

            if email == "pro1@example.com" {
                primary_pro_user_id = uid;
            }

            if let Some(existing_profile) = professional_profiles::Entity::find().filter(professional_profiles::Column::UserId.eq(uid)).one(&ctx.db).await? {
                let mut active_prof: professional_profiles::ActiveModel = existing_profile.into();
                active_prof.bio = Set(Some(bio.to_string()));
                active_prof.total_reviews = Set(reviews);
                active_prof.average_rating = Set(Decimal::new(rating, 2));
                active_prof.subscription_status = Set("ACTIVE".to_string());
                active_prof.updated_at = Set(now);
                active_prof.update(&ctx.db).await?;
            } else {
                let profile = professional_profiles::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    user_id: Set(uid),
                    bio: Set(Some(bio.to_string())),
                    years_experience: Set(exp),
                    hourly_rate: Set(Decimal::new(rate, 2)),
                    service_radius_km: Set(50),
                    address: Set(Some(addr.to_string())),
                    average_rating: Set(Decimal::new(rating, 2)),
                    total_reviews: Set(reviews),
                    subscription_status: Set("ACTIVE".to_string()),
                    subscription_plan: Set("pro".to_string()),
                    created_at: Set(now),
                    updated_at: Set(now),
                    ..Default::default()
                };
                profile.insert(&ctx.db).await?;
            }
        }

        // 6. Banners Promocionais (1 Profissional Pro1 + 2 Externos) com Validade de 30 dias
        let ads_count = advertisements::Entity::find().count(&ctx.db).await?;
        if ads_count == 0 && primary_pro_user_id != Uuid::nil() {
            let in_30_days: sea_orm::prelude::DateTimeWithTimeZone = (Utc::now() + Duration::days(30)).into();

            let ad1 = advertisements::ActiveModel {
                id: Set(Uuid::new_v4()),
                ad_type: Set("PROFESSIONAL_DIRECT".to_string()),
                title: Set("Eletricista 24h com Marcos Oliveira".to_string()),
                subtitle: Set(Some("Atendimento elétrico residencial e emergências com desconto".to_string())),
                banner_image_url: Set("https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80".to_string()),
                professional_user_id: Set(Some(primary_pro_user_id)),
                category_id: Set(Some("eletrica".to_string())),
                status: Set("ACTIVE".to_string()),
                priority: Set(10),
                expires_at: Set(Some(in_30_days)),
                created_at: Set(now),
                ..Default::default()
            };
            ad1.insert(&ctx.db).await?;

            let ad2 = advertisements::ActiveModel {
                id: Set(Uuid::new_v4()),
                ad_type: Set("EXTERNAL_LINK".to_string()),
                title: Set("Lojas Guaporé - 20% OFF em Materiais Elétricos".to_string()),
                subtitle: Set(Some("Fiações, disjuntores e luminárias em promoção".to_string())),
                banner_image_url: Set("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80".to_string()),
                target_url: Set(Some("https://www.lojasguapore.com.br".to_string())),
                status: Set("ACTIVE".to_string()),
                priority: Set(5),
                expires_at: Set(Some(in_30_days)),
                created_at: Set(now),
                ..Default::default()
            };
            ad2.insert(&ctx.db).await?;

            let ad3 = advertisements::ActiveModel {
                id: Set(Uuid::new_v4()),
                ad_type: Set("EXTERNAL_LINK".to_string()),
                title: Set("Tintas Coral - As Melhores Cores para Sua Casa".to_string()),
                subtitle: Set(Some("Compre tintas e acessórios com frete grátis".to_string())),
                banner_image_url: Set("https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80".to_string()),
                target_url: Set(Some("https://www.coral.com.br".to_string())),
                status: Set("ACTIVE".to_string()),
                priority: Set(3),
                expires_at: Set(Some(in_30_days)),
                created_at: Set(now),
                ..Default::default()
            };
            ad3.insert(&ctx.db).await?;

            println!("📢 3 Banners Promocionais com validade criados no seed com sucesso!");
        }

        println!("✅ Seed Rust Completo com 6 Profissionais e Banners Atualizados!");
        Ok(())
    }
}
