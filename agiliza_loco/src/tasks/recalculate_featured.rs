use loco_rs::prelude::*;
use sea_orm::{ActiveModelTrait, EntityTrait, Set, ColumnTrait, QueryFilter};
use uuid::Uuid;
use chrono::Utc;
use rand::seq::SliceRandom;

use crate::models::_entities::{professional_profiles, featured_professionals};

pub struct RecalculateFeatured;

#[async_trait]
impl Task for RecalculateFeatured {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "recalculate_featured".to_string(),
            detail: "Calcula estatisticamente (P50 de avaliacoes + P80 de nota + Sorteio aleatorio de 5+) e salva os profissionais em destaque do dia".to_string(),
        }
    }

    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        println!("🎲 Calculando estatisticamente os profissionais em destaque para hoje...");

        // 1. Buscar todos os profissionais com assinatura ativa
        let all_profiles = professional_profiles::Entity::find()
            .filter(professional_profiles::Column::SubscriptionStatus.is_in(vec![
                "ACTIVE".to_string(), "active".to_string(), "TRIALING".to_string(), "trialing".to_string()
            ]))
            .all(&ctx.db)
            .await?;

        if all_profiles.is_empty() {
            println!("⚠️ Nenhum profissional ativo encontrado para calcular destaques.");
            return Ok(());
        }

        // 2. Calcular P50 (Mediana) de total_reviews
        let mut reviews_vec: Vec<i32> = all_profiles.iter().map(|p| p.total_reviews).collect();
        reviews_vec.sort_unstable();
        
        let p50_threshold = if !reviews_vec.is_empty() {
            let mid = reviews_vec.len() / 2;
            reviews_vec[mid]
        } else {
            0
        };

        println!("📊 Estatísticas: Total de profissionais={}, Mediana de avaliações (P50)={}", all_profiles.len(), p50_threshold);

        // 3. Filtrar elegíveis pelo P50 (com Fallback inteligente caso haja menos de 5)
        let mut eligible: Vec<_> = all_profiles.iter().filter(|p| p.total_reviews >= p50_threshold).cloned().collect();

        if eligible.len() < 5 {
            println!("🔄 Fallback acionado: Poucos profissionais no P50 ({}). Incluindo todos os cadastrados.", eligible.len());
            eligible = all_profiles.clone();
        }

        // 4. Ordenar elegíveis pela nota média (average_rating DESC)
        eligible.sort_by(|a, b| b.average_rating.cmp(&a.average_rating));

        // 5. Selecionar o grupo do Percentil 80 (top 80% dos elegíveis por nota, mínimo 5)
        let top_size = if eligible.len() <= 5 {
            eligible.len()
        } else {
            let p80_count = (eligible.len() as f64 * 0.8).ceil() as usize;
            p80_count.max(5)
        };

        let mut top_p80_group: Vec<_> = eligible.into_iter().take(top_size).collect();

        // 6. Sortear aleatoriamente dentre os top P80 (em bloco síncrono para garantir Send)
        let final_featured_pros: Vec<_> = {
            let mut rng = rand::rng();
            top_p80_group.shuffle(&mut rng);
            top_p80_group.into_iter().take(6).collect()
        };

        println!("✨ Selecionados {} profissionais para o destaque de hoje!", final_featured_pros.len());

        // 7. Persistir na tabela featured_professionals para a data de hoje
        let today = Utc::now().date_naive();

        // Limpar destaques da data de hoje se já existirem
        featured_professionals::Entity::delete_many()
            .filter(featured_professionals::Column::FeaturedDate.eq(today))
            .exec(&ctx.db)
            .await?;

        for pro in final_featured_pros {
            let active_featured = featured_professionals::ActiveModel {
                id: Set(Uuid::new_v4()),
                professional_profile_id: Set(pro.id),
                user_id: Set(pro.user_id),
                featured_date: Set(today),
                created_at: Set(Utc::now().into()),
            };
            active_featured.insert(&ctx.db).await?;
            println!("⭐ Destacado hoje: Profissional UserID={} (Avaliações: {}, Nota: {})", pro.user_id, pro.total_reviews, pro.average_rating);
        }

        println!("✅ Profissionais em destaque recalculados e salvos com sucesso!");
        Ok(())
    }
}
