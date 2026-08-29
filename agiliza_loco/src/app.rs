use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::{Queue, BackgroundWorker},
    boot::{create_app, BootResult, StartMode},
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    Result,
};
use migration::Migrator;

use crate::{
    controllers,
    tasks,
    workers::downloader::DownloadWorker,
};

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        "agiliza_loco"
    }

    fn app_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    async fn boot(
        mode: StartMode,
        environment: &Environment,
        config: loco_rs::config::Config,
    ) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    async fn initializers(_ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        Ok(vec![])
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::with_default_routes()
            .add_route(controllers::auth::routes())
            .add_route(controllers::auth_social::routes())
            .add_route(controllers::device_tokens::routes())
            .add_route(controllers::professionals::routes())
            .add_route(controllers::portfolio::routes())
            .add_route(controllers::availability::routes())
            .add_route(controllers::favorites::routes())
            .add_route(controllers::reviews::routes())
            .add_route(controllers::categories::routes())
            .add_route(controllers::service_requests::routes())
            .add_route(controllers::quotes::routes())
            .add_route(controllers::webhooks::routes())
            .add_route(controllers::billing::routes())
            .add_route(controllers::chat::routes())
            .add_route(controllers::admin::routes())
            .add_route(controllers::advertisements::routes())
    }

    async fn connect_workers(ctx: &AppContext, queue: &Queue) -> Result<()> {
        queue.register(DownloadWorker::build(ctx)).await?;
        Ok(())
    }

    fn register_tasks(tasks: &mut Tasks) {
        tasks.register(tasks::seed_data::SeedData);
        tasks.register(tasks::seed_massive::SeedMassive);
        tasks.register(tasks::seed_complete::SeedComplete);
        tasks.register(tasks::db_reset::DbReset);
        tasks.register(tasks::recalculate_featured::RecalculateFeatured);
    }

    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &std::path::Path) -> Result<()> {
        Ok(())
    }
}