use loco_rs::{prelude::*, hash};
use sea_orm::{ActiveModelTrait, EntityTrait, Set, ColumnTrait, QueryFilter, PaginatorTrait};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{Utc, Duration};
use crate::models::_entities::{
    users, professional_profiles, service_requests, reviews
};
use crate::tasks::recalculate_featured::RecalculateFeatured;

pub struct SeedMassive;

#[async_trait]
impl Task for SeedMassive {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "seed_massive".to_string(),
            detail: "Gera massa de dados massiva: 50 profissionais, 500 clientes, 1000 pedidos e centenas de avaliações para testes".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!("🚀 Iniciando Seed Massivo (50 Profissionais, 500 Clientes, 1000 Serviços + Avaliações)...");

        let password_hash = hash::hash_password("123456")?;
        let now: sea_orm::prelude::DateTimeWithTimeZone = Utc::now().into();

        // Nomes para geração de profissionais e clientes
        let first_names = vec![
            "Marcos", "Roberto", "Carlos", "Fernando", "Amanda", "Lucas", "Juliana", "Patrícia", "Ricardo", "Gabriel",
            "Vanessa", "Rodrigo", "Diego", "Bruno", "Rafael", "Camila", "Tiago", "Marcelo", "Felipe", "Mariana",
            "Gustavo", "Letícia", "Guilherme", "Renata", "Leonardo", "Aline", "Eduardo", "Carolina", "Henrique", "Tatiana",
            "Thiago", "Beatriz", "Alexandre", "Priscila", "Daniel", "Fernanda", "André", "Monique", "Luciana", "Vinícius"
        ];
        
        let last_names = vec![
            "Silva", "Oliveira", "Santos", "Souza", "Lima", "Pereira", "Ferreira", "Alves", "Costa", "Rodrigues",
            "Martins", "Gomes", "Barbosa", "Ramos", "Castro", "Ribeiro", "Carvalho", "Mendes", "Nascimento", "Araújo"
        ];

        let specialties = vec![
            ("eletrica", "Eletricista Residencial & Comercial", "Especialista em fiação, quadros de força e iluminação LED"),
            ("encanamento", "Encanador & Desentupimentos 24h", "Reparos hidráulicos, detecção de vazamentos e tubulação"),
            ("pintura", "Pintor Profissional & Texturas", "Pinturas internas, externas, aplicação de resina e grafiato"),
            ("limpeza", "Limpeza Pós-Obra & Residencial", "Higienização profunda, tratamento de pisos e limpeza fina"),
            ("reformas", "Mestre de Obras & Pequenas Reformas", "Alvenaria, assentamento de pisos, porcelanato e estrutura"),
            ("instalacao-chuveiro", "Instalador de Chuveiros & Torneiras", "Troca de resistência, chuveiros pressurizados e metais"),
            ("troca-fiacao", "Técnico em Redes Elétricas & Cabeamento", "Substituição completa de fiação antiga e automação"),
            ("desentupimento", "Especialista em Desentupimento Hidráulico", "Desentupimento de pias, ralos, colunas e vasos sanitários"),
        ];

        let comments = vec![
            "Trabalho impecável! Chegou exatamente no horário e resolveu o problema rápido.",
            "Muito atencioso, explicou tudo o que precisava ser feito e deixou o local limpo.",
            "Serviço de altíssima qualidade. Preço justo e muito profissional.",
            "Excelente atendimento. Com certeza chamarei novamente quando precisar!",
            "Super caprichoso e honesto com o orçamento. Recomendo de olhos fechados.",
            "Resolveu o vazamento em poucos minutos. Nota 10!",
            "Pintura ficou perfeita, sem nenhuma sujeira no chão. Nota mil!",
            "Instalou todo o quadro elétrico com muita segurança. Nota máxima!"
        ];

        // 1. Criar 50 Profissionais com notas e volumes de avaliações realistas
        println!("🛠️ Criando 50 Profissionais...");
        let mut prof_profile_ids = Vec::new();

        for i in 1..=50 {
            let email = format!("pro_mass_{}@agilizapro.com.br", i);
            let fname = first_names[i % first_names.len()];
            let lname = last_names[(i * 3) % last_names.len()];
            let full_name = format!("{} {}", fname, lname);

            let (_cat_id, spec_title, spec_bio) = specialties[i % specialties.len()];

            let user_id = if let Some(existing) = users::Entity::find().filter(users::Column::Email.eq(&email)).one(&ctx.db).await? {
                existing.id
            } else {
                let uid = Uuid::new_v4();
                let u = users::ActiveModel {
                    id: Set(uid),
                    email: Set(email.clone()),
                    password: Set(password_hash.clone()),
                    name: Set(full_name.clone()),
                    api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                    role: Set(Some("PROFESSIONAL".to_string())),
                    is_staff: Set(Some(false)),
                    is_verified: Set(Some(true)),
                    is_active: Set(Some(true)),
                    is_blocked: Set(Some(false)),
                    cpf: Set(Some(format!("{:03}.{:03}.{:03}-{:02}", i, i*2, i*3, i%99))),
                    created_at: Set(now),
                    updated_at: Set(now),
                    ..Default::default()
                };
                u.insert(&ctx.db).await?;
                uid
            };

            // Gerar distribuição variada de avaliações (de 3 a 115 avaliações)
            let total_reviews = match i {
                1..=10 => 80 + (i as f64 * 3.5) as i32,  // Top tier (80 - 115 avaliações)
                11..=30 => 35 + (i * 2) as i32,         // Mid tier (35 - 75 avaliações)
                _ => 3 + (i % 15) as i32,               // Low tier (3 - 18 avaliações)
            };

            let rating_val = match i {
                1..=15 => 4.8 + ((i % 3) as f64 * 0.1), // 4.8 a 5.0
                16..=35 => 4.2 + ((i % 5) as f64 * 0.1), // 4.2 a 4.7
                _ => 3.5 + ((i % 6) as f64 * 0.1),        // 3.5 a 4.0
            };

            let hourly_rate = 60 + ((i * 5) % 90);

            let prof_profile_id = if let Some(existing_profile) = professional_profiles::Entity::find().filter(professional_profiles::Column::UserId.eq(user_id)).one(&ctx.db).await? {
                let mut active: professional_profiles::ActiveModel = existing_profile.clone().into();
                active.bio = Set(Some(format!("{} - {}", spec_title, spec_bio)));
                active.average_rating = Set(Decimal::from_f64_retain(rating_val).unwrap_or(Decimal::new(480, 2)));
                active.total_reviews = Set(total_reviews);
                active.subscription_status = Set("ACTIVE".to_string());
                active.updated_at = Set(now);
                active.update(&ctx.db).await?;
                existing_profile.id
            } else {
                let pid = Uuid::new_v4();
                let prof = professional_profiles::ActiveModel {
                    id: Set(pid),
                    user_id: Set(user_id),
                    bio: Set(Some(format!("{} - {}", spec_title, spec_bio))),
                    years_experience: Set(3 + (i % 15) as i32),
                    hourly_rate: Set(Decimal::new(hourly_rate as i64 * 100, 2)),
                    service_radius_km: Set(30 + (i % 40) as i32),
                    address: Set(Some(format!("São Paulo, SP - Bairro {}", i))),
                    average_rating: Set(Decimal::from_f64_retain(rating_val).unwrap_or(Decimal::new(480, 2))),
                    total_reviews: Set(total_reviews),
                    subscription_status: Set("ACTIVE".to_string()),
                    subscription_plan: Set(if i % 2 == 0 { "premium".to_string() } else { "pro".to_string() }),
                    created_at: Set(now),
                    updated_at: Set(now),
                    ..Default::default()
                };
                prof.insert(&ctx.db).await?;
                pid
            };

            prof_profile_ids.push(prof_profile_id);
        }

        // Adicionar também o pro1 ao grupo de perfis para seed de avaliações
        if let Some(pro1_user) = users::Entity::find().filter(users::Column::Email.eq("pro1@example.com")).one(&ctx.db).await? {
            if let Some(pro1_prof) = professional_profiles::Entity::find().filter(professional_profiles::Column::UserId.eq(pro1_user.id)).one(&ctx.db).await? {
                prof_profile_ids.push(pro1_prof.id);
            }
        }

        // 2. Criar 500 Clientes
        println!("👤 Criando 500 Clientes...");
        let mut client_user_ids = Vec::new();

        for c in 1..=500 {
            let email = format!("cliente_mass_{}@agilizapro.com.br", c);
            let fname = first_names[c % first_names.len()];
            let lname = last_names[(c * 7) % last_names.len()];
            let full_name = format!("{} {}", fname, lname);

            let client_id = if let Some(existing) = users::Entity::find().filter(users::Column::Email.eq(&email)).one(&ctx.db).await? {
                existing.id
            } else {
                let uid = Uuid::new_v4();
                let u = users::ActiveModel {
                    id: Set(uid),
                    email: Set(email),
                    password: Set(password_hash.clone()),
                    name: Set(full_name),
                    api_key: Set(format!("ako_{}", Uuid::new_v4().simple())),
                    role: Set(Some("CLIENT".to_string())),
                    is_staff: Set(Some(false)),
                    is_verified: Set(Some(true)),
                    is_active: Set(Some(true)),
                    is_blocked: Set(Some(false)),
                    cpf: Set(Some(format!("{:03}.{:03}.{:03}-{:02}", c % 999, (c*4) % 999, (c*7) % 999, c % 99))),
                    created_at: Set(now),
                    updated_at: Set(now),
                    ..Default::default()
                };
                u.insert(&ctx.db).await?;
                uid
            };

            client_user_ids.push(client_id);
        }

        // 3. Criar Avaliações Individuais (Reviews) Conectando Clientes e Profissionais
        println!("⭐ Criando Seed de Avaliações Individuais nas Contas dos Profissionais...");
        let review_count = reviews::Entity::find().count(&ctx.db).await?;
        if review_count < 200 {
            for (idx, &prof_pid) in prof_profile_ids.iter().enumerate() {
                // Gerar 5 avaliações por profissional
                for r_idx in 1..=5 {
                    let client_id = client_user_ids[(idx * 7 + r_idx * 13) % client_user_ids.len()];
                    let rating = if r_idx == 1 { 4 } else { 5 };
                    let comment = comments[(idx + r_idx) % comments.len()];

                    let rev = reviews::ActiveModel {
                        id: Set(Uuid::new_v4()),
                        client_id: Set(client_id),
                        professional_profile_id: Set(prof_pid),
                        rating: Set(rating),
                        comment: Set(Some(comment.to_string())),
                        created_at: Set((Utc::now() - Duration::days((idx * 2 + r_idx * 5) as i64 % 60)).into()),
                        updated_at: Set(now),
                    };
                    let _ = rev.insert(&ctx.db).await;
                }
            }
            println!("✅ Centenas de Avaliações criadas e vinculadas aos perfis com sucesso!");
        }

        // 4. Criar 1000 Pedidos de Serviços Conectando Clientes e Profissionais
        println!("📋 Gerando 1000 Pedidos de Serviços Conectados...");
        let request_count = service_requests::Entity::find().count(&ctx.db).await?;
        if request_count < 500 {
            let titles = vec![
                "Conserto de fiação em curto na cozinha",
                "Instalação de 2 chuveiros elétricos Lorenzetti",
                "Vazamento no sifão do banheiro principal",
                "Pintura completa de sala de estar e corredor",
                "Limpeza pós-obra de apartamento de 70m2",
                "Troca de disjuntor e revisão do quadro elétrico",
                "Troca de torneira e reparo de registro",
                "Reforma de parede com umidade e pintura",
            ];

            for r in 1..=1000 {
                let client_id = client_user_ids[r % client_user_ids.len()];
                let prof_profile_id = prof_profile_ids[(r * 3) % prof_profile_ids.len()];
                let (cat_id, _, _) = specialties[r % specialties.len()];
                let title = titles[r % titles.len()];

                let status = match r % 4 {
                    0 => "COMPLETED",
                    1 => "ACCEPTED",
                    2 => "OPEN",
                    _ => "CANCELLED",
                };

                let req = service_requests::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    client_id: Set(client_id),
                    professional_profile_id: Set(if status == "OPEN" { None } else { Some(prof_profile_id) }),
                    service_category_id: Set(Some(cat_id.to_string())),
                    title: Set(format!("{} #{}", title, r)),
                    description: Set(format!("Pedido de teste massivo número {} gerado automaticamente.", r)),
                    status: Set(status.to_string()),
                    address: Set(Some(format!("Rua dos Testes, {} - São Paulo, SP", r))),
                    quoted_price: Set(Some(Decimal::new((150 + (r % 350)) as i64 * 100, 2))),
                    created_at: Set((Utc::now() - Duration::days((r % 90) as i64)).into()),
                    updated_at: Set(now),
                    ..Default::default()
                };
                req.insert(&ctx.db).await?;
            }
            println!("✅ 1000 Pedidos de Serviço criados com sucesso!");
        }

        // 5. Executar o cálculo estatístico dos profissionais em destaque do dia
        RecalculateFeatured.run(ctx, _vars).await?;

        println!("🎉 Seed Massivo + Avaliações concluído com sucesso!");
        Ok(())
    }
}
