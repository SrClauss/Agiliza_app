use async_trait::async_trait;
use chrono::{offset::Local, Duration};
use loco_rs::{auth::jwt, hash, prelude::*};
use serde::{Deserialize, Serialize};
use serde_json::Map;
use uuid::Uuid;

pub use super::_entities::users::{self, ActiveModel, Entity, Model};

pub const MAGIC_LINK_LENGTH: i8 = 32;
pub const MAGIC_LINK_EXPIRATION_MIN: i8 = 5;

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginParams {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct RegisterParams {
    pub email: String,
    pub password: String,
    pub name: String,
    #[serde(default)]
    pub password_confirm: Option<String>,
    #[serde(default)]
    pub full_name: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub cpf: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
}

#[derive(Debug, Validate, Deserialize)]
pub struct Validator {
    #[validate(length(min = 2, message = "Name must be at least 2 characters long."))]
    pub name: String,
    #[validate(email(message = "invalid email"))]
    pub email: String,
}

impl Validatable for ActiveModel {
    fn validator(&self) -> Box<dyn Validate> {
        Box::new(Validator {
            name: self.name.as_ref().to_owned(),
            email: self.email.as_ref().to_owned(),
        })
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for super::_entities::users::ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        self.validate()?;
        if insert {
            let mut this = self;
            this.id = ActiveValue::Set(Uuid::new_v4());
            this.api_key = ActiveValue::Set(format!("lo-{}", Uuid::new_v4()));
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

#[async_trait]
impl Authenticable for Model {
    async fn find_by_api_key(db: &DatabaseConnection, api_key: &str) -> ModelResult<Self> {
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::ApiKey, api_key)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    async fn find_by_claims_key(db: &DatabaseConnection, claims_key: &str) -> ModelResult<Self> {
        Self::find_by_id(db, claims_key).await
    }
}

impl Model {
    pub async fn find_by_email(db: &DatabaseConnection, email: &str) -> ModelResult<Self> {
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::Email, email)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    pub async fn find_by_verification_token(
        db: &DatabaseConnection,
        token: &str,
    ) -> ModelResult<Self> {
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::EmailVerificationToken, token)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    pub async fn find_by_magic_token(db: &DatabaseConnection, token: &str) -> ModelResult<Self> {
        let user = users::Entity::find()
            .filter(
                query::condition()
                    .eq(users::Column::MagicLinkToken, token)
                    .build(),
            )
            .one(db)
            .await?;

        let user = user.ok_or_else(|| ModelError::EntityNotFound)?;
        if let Some(expired_at) = user.magic_link_expiration {
            if expired_at >= Local::now() {
                Ok(user)
            } else {
                Err(ModelError::msg("magic token expired"))
            }
        } else {
            Err(ModelError::msg("expiration token not exists"))
        }
    }

    pub async fn find_by_reset_token(db: &DatabaseConnection, token: &str) -> ModelResult<Self> {
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::ResetToken, token)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    pub async fn find_by_id(db: &DatabaseConnection, pid: &str) -> ModelResult<Self> {
        let parse_uuid = Uuid::parse_str(pid).map_err(|e| ModelError::Any(e.into()))?;
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::Id, parse_uuid)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    pub async fn find_by_api_key(db: &DatabaseConnection, api_key: &str) -> ModelResult<Self> {
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::ApiKey, api_key)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    #[must_use]
    pub fn verify_password(&self, password: &str) -> bool {
        hash::verify_password(password, &self.password)
    }

    pub async fn create_with_password(
        db: &DatabaseConnection,
        params: &RegisterParams,
    ) -> ModelResult<Self> {
        let txn = db.begin().await?;

        if users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::Email, &params.email)
                    .build(),
            )
            .one(&txn)
            .await?
            .is_some()
        {
            return Err(ModelError::EntityAlreadyExists {});
        }

        let name = if let Some(ref fn_name) = params.full_name {
            fn_name.clone()
        } else if !params.name.is_empty() {
            params.name.clone()
        } else {
            "User".to_string()
        };

        let role = params.role.clone().unwrap_or_else(|| "CLIENT".to_string());
        let password_hash =
            hash::hash_password(&params.password).map_err(|e| ModelError::Any(e.into()))?;

        let user = users::ActiveModel {
            email: ActiveValue::set(params.email.to_string()),
            password: ActiveValue::set(password_hash),
            name: ActiveValue::set(name),
            phone: ActiveValue::set(params.phone.clone()),
            cpf: ActiveValue::set(params.cpf.clone()),
            role: ActiveValue::set(Some(role)),
            is_verified: ActiveValue::set(Some(false)),
            is_active: ActiveValue::set(Some(true)),
            is_staff: ActiveValue::set(Some(false)),
            ..Default::default()
        }
        .insert(&txn)
        .await?;

        txn.commit().await?;

        Ok(user)
    }

    pub fn generate_jwt(&self, secret: &str, expiration: u64) -> ModelResult<String> {
        jwt::JWT::new(secret)
            .generate_token(expiration, self.id.to_string(), Map::new())
            .map_err(ModelError::from)
    }
}

impl ActiveModel {
    pub async fn set_email_verification_sent(
        mut self,
        db: &DatabaseConnection,
    ) -> ModelResult<Model> {
        self.email_verification_sent_at = ActiveValue::set(Some(Local::now().into()));
        self.email_verification_token = ActiveValue::Set(Some(Uuid::new_v4().to_string()));
        self.update(db).await.map_err(ModelError::from)
    }

    pub async fn set_forgot_password_sent(mut self, db: &DatabaseConnection) -> ModelResult<Model> {
        self.reset_sent_at = ActiveValue::set(Some(Local::now().into()));
        self.reset_token = ActiveValue::Set(Some(Uuid::new_v4().to_string()));
        self.update(db).await.map_err(ModelError::from)
    }

    pub async fn verified(mut self, db: &DatabaseConnection) -> ModelResult<Model> {
        self.email_verified_at = ActiveValue::set(Some(Local::now().into()));
        self.is_verified = ActiveValue::set(Some(true));
        self.update(db).await.map_err(ModelError::from)
    }

    pub async fn reset_password(
        mut self,
        db: &DatabaseConnection,
        password: &str,
    ) -> ModelResult<Model> {
        self.password =
            ActiveValue::set(hash::hash_password(password).map_err(|e| ModelError::Any(e.into()))?);
        self.reset_token = ActiveValue::Set(None);
        self.reset_sent_at = ActiveValue::Set(None);
        self.update(db).await.map_err(ModelError::from)
    }

    pub async fn create_magic_link(mut self, db: &DatabaseConnection) -> ModelResult<Model> {
        let random_str = hash::random_string(MAGIC_LINK_LENGTH as usize);
        let expired = Local::now() + Duration::minutes(MAGIC_LINK_EXPIRATION_MIN.into());

        self.magic_link_token = ActiveValue::set(Some(random_str));
        self.magic_link_expiration = ActiveValue::set(Some(expired.into()));
        self.update(db).await.map_err(ModelError::from)
    }

    pub async fn clear_magic_link(mut self, db: &DatabaseConnection) -> ModelResult<Model> {
        self.magic_link_token = ActiveValue::set(None);
        self.magic_link_expiration = ActiveValue::set(None);
        self.update(db).await.map_err(ModelError::from)
    }
}
