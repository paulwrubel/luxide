use std::sync::Arc;

use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;

use crate::tracing::{RenderManager, ResourceManager};

use super::{AuthManager, AuthManagerError, Claims, JwtValidator};

#[derive(Clone)]
pub struct LuxideState {
    pub render_manager: Arc<RenderManager>,
    pub auth_manager: Arc<AuthManager>,
    pub resource_manager: Arc<ResourceManager>,

    pub(crate) cookie_jar_key: Key,
}

impl LuxideState {
    pub fn new(
        render_manager: Arc<RenderManager>,
        auth_manager: Arc<AuthManager>,
        resource_manager: Arc<ResourceManager>,
        cookie_jar_key: Key,
    ) -> Self {
        Self {
            render_manager,
            auth_manager,
            resource_manager,
            cookie_jar_key,
        }
    }
}

impl FromRef<LuxideState> for Key {
    fn from_ref(state: &LuxideState) -> Self {
        state.cookie_jar_key.clone()
    }
}

impl JwtValidator for LuxideState {
    type Error = AuthManagerError;

    fn validate_jwt(&self, jwt: &str) -> Result<Claims, Self::Error> {
        self.auth_manager.validate_jwt(jwt)
    }
}
