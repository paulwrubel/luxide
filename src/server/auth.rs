use crate::config::{APIConfig, AuthSecrets};
use dashmap::DashMap;
use oauth2::{CsrfToken, EndpointNotSet, EndpointSet, TokenResponse};
use uuid::Uuid;

pub type SessionID = Uuid;
pub type BearerToken =
    oauth2::StandardTokenResponse<oauth2::EmptyExtraTokenFields, oauth2::basic::BasicTokenType>;

pub struct AuthManager {
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
    pub fn new_github(config: &APIConfig, secrets: &AuthSecrets) -> Self {
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

        Self {
            oauth_client,
            http_client,

            auth_state_by_session: DashMap::new(),
        }
    }

    pub fn get_auth_url_and_state(&self) -> (String, CsrfToken) {
        let (url, state) = self.oauth_client.authorize_url(CsrfToken::new_random).url();

        (url.to_string(), state)
    }

    pub async fn exchange_code(&self, authorization_code: String) -> Result<BearerToken, String> {
        self.oauth_client
            .exchange_code(oauth2::AuthorizationCode::new(authorization_code))
            .request_async(&self.http_client)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_github_user_info(&self, token: BearerToken) -> Result<String, String> {
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

        response.text().await.map_err(|e| e.to_string())
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
