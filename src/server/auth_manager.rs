use crate::{
    config::{APIConfig, AuthSecrets},
    tracing::{GithubID, User, UserID, UserStorage},
};
use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};
use dashmap::DashMap;
use jsonwebtoken::{DecodingKey, EncodingKey};
use oauth2::{CsrfToken, EndpointNotSet, EndpointSet, TokenResponse};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

pub type SessionID = Uuid;
pub type BearerToken =
    oauth2::StandardTokenResponse<oauth2::EmptyExtraTokenFields, oauth2::basic::BasicTokenType>;
pub type AuthManagerError = String;

pub struct AuthManager {
    storage: Arc<dyn UserStorage>,
    jwt_encoding_secret: EncodingKey,
    jwt_decoding_secret: DecodingKey,

    oauth_client: oauth2::basic::BasicClient<
        EndpointSet,
        EndpointNotSet,
        EndpointNotSet,
        EndpointNotSet,
        EndpointSet,
    >,
    http_client: reqwest::Client,

    auth_state_by_session: DashMap<SessionID, CsrfToken>,
}

impl AuthManager {
    pub const JWT_EXPIRE_AFTER_HOURS: i64 = 24;

    pub fn new_github(
        storage: Arc<dyn UserStorage>,
        config: &APIConfig,
        secrets: &AuthSecrets,
    ) -> Self {
        let client_id = oauth2::ClientId::new(secrets.github.client_id.clone());
        let client_secret = oauth2::ClientSecret::new(secrets.github.client_secret.clone());
        let auth_uri = oauth2::AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
            .expect("Invalid auth URL");
        let token_uri =
            oauth2::TokenUrl::new("https://github.com/login/oauth/access_token".to_string())
                .expect("Invalid token URL");
        let redirect_uri = oauth2::RedirectUrl::new(format!(
            "http://{}:{}/auth/github/callback",
            config.address, config.port
        ))
        .expect("Invalid redirect URL");

        let oauth_client = oauth2::basic::BasicClient::new(client_id)
            .set_client_secret(client_secret)
            .set_auth_uri(auth_uri)
            .set_token_uri(token_uri)
            .set_redirect_uri(redirect_uri);

        let http_client = reqwest::ClientBuilder::new()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("Client should build successfully");

        let jwt_private_key = std::fs::read(&secrets.jwt.private_key_pem_filename)
            .map_err(|e| e.to_string())
            .expect("Failed to read JWT private key PEM");

        let jwt_public_key = std::fs::read(&secrets.jwt.public_key_pem_filename)
            .map_err(|e| e.to_string())
            .expect("Failed to read JWT public key PEM");

        Self {
            storage,
            jwt_encoding_secret: EncodingKey::from_rsa_pem(&jwt_private_key)
                .expect("Failed to parse JWT encoding secret PEM"),
            jwt_decoding_secret: DecodingKey::from_rsa_pem(&jwt_public_key)
                .expect("Failed to parse JWT decoding secret PEM"),

            oauth_client,
            http_client,

            auth_state_by_session: DashMap::new(),
        }
    }

    pub async fn get_user(&self, user_id: UserID) -> Result<Option<User>, AuthManagerError> {
        self.storage
            .get_user(user_id)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn get_user_by_github_id(
        &self,
        github_id: GithubID,
    ) -> Result<Option<User>, AuthManagerError> {
        self.storage
            .get_user_by_github_id(github_id)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn user_exists(&self, user_id: UserID) -> Result<bool, AuthManagerError> {
        self.storage
            .user_exists(user_id)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn user_exists_by_github_id(
        &self,
        github_id: GithubID,
    ) -> Result<bool, AuthManagerError> {
        self.storage
            .user_exists_by_github_id(github_id)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn create_user(&self, user: User) -> Result<User, AuthManagerError> {
        self.storage
            .create_user(user)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn update_user(&self, user: User) -> Result<User, AuthManagerError> {
        self.storage
            .update_user(user)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn delete_user(&self, user_id: UserID) -> Result<(), AuthManagerError> {
        self.storage
            .delete_user(user_id)
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn get_next_user_id(&self) -> Result<UserID, AuthManagerError> {
        self.storage
            .get_next_user_id()
            .await
            .map_err(|e| AuthManagerError::from(e))
    }

    pub async fn generate_new_jwt(&self, user_id: UserID) -> Result<String, AuthManagerError> {
        let now = chrono::Utc::now();
        let valid_duration = chrono::Duration::hours(AuthManager::JWT_EXPIRE_AFTER_HOURS);

        let claims = Claims {
            sub: user_id,
            exp: now
                .checked_add_signed(valid_duration)
                .expect("Invalid expiration time")
                .timestamp() as usize,
            iat: now.timestamp() as usize,
        };

        jsonwebtoken::encode(
            &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::RS256),
            &claims,
            &self.jwt_encoding_secret,
        )
        .map_err(|e| e.to_string())
    }

    pub fn get_auth_url_and_state(&self) -> (String, CsrfToken) {
        let (url, state) = self.oauth_client.authorize_url(CsrfToken::new_random).url();

        (url.to_string(), state)
    }

    pub async fn exchange_code(
        &self,
        authorization_code: String,
    ) -> Result<BearerToken, AuthManagerError> {
        self.oauth_client
            .exchange_code(oauth2::AuthorizationCode::new(authorization_code))
            .request_async(&self.http_client)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_github_user_info(
        &self,
        token: BearerToken,
    ) -> Result<GitHubUserInfo, AuthManagerError> {
        let response = self
            .http_client
            .get("https://api.github.com/user")
            .header("Accept", "application/vnd.github+json")
            .header("X-GitHub-Api-Version", "2022-11-28")
            .header("User-Agent", "luxide")
            .bearer_auth(token.access_token().secret())
            .send()
            .await
            .map_err(|e| e.to_string())?;

        serde_json::from_str(&response.text().await.map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())
    }

    pub fn set_state_for_session_id(&self, session_id: SessionID, state: CsrfToken) {
        self.auth_state_by_session.insert(session_id, state);
    }

    pub fn get_state_for_session_id(&self, session_id: SessionID) -> Option<CsrfToken> {
        self.auth_state_by_session
            .get(&session_id)
            .map(|state| state.clone())
    }

    pub fn remove_state_for_session_id(&self, session_id: SessionID) {
        self.auth_state_by_session.remove(&session_id);
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubUserInfo {
    pub id: GithubID,
    pub login: String,
    pub avatar_url: String,
}

pub trait JWTValidator {
    type Error;

    fn validate_jwt(&self, token: &str) -> Result<Claims, Self::Error>;
}

impl JWTValidator for AuthManager {
    type Error = AuthManagerError;

    fn validate_jwt(&self, token: &str) -> Result<Claims, Self::Error> {
        let decoded_token = jsonwebtoken::decode::<Claims>(
            token,
            &self.jwt_decoding_secret,
            &jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::RS256),
        )
        .map_err(|e| e.to_string())?;

        Ok(decoded_token.claims)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: UserID,
    pub exp: usize,
    pub iat: usize,
}

impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync + JWTValidator,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // extract the Authorization header
        let TypedHeader(Authorization(bearer)) =
            TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state)
                .await
                .map_err(|_| StatusCode::UNAUTHORIZED.into_response())?;

        // verify the JWT
        let claims = state
            .validate_jwt(bearer.token())
            .map_err(|_| StatusCode::UNAUTHORIZED.into_response())?;

        // Return the authenticated user
        Ok(claims)
    }
}
