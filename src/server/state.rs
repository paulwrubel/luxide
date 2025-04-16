use std::sync::Arc;

use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;

use crate::tracing::RenderManager;

use super::{AuthManager, AuthManagerError, Claims, JWTValidator};

#[derive(Clone)]
pub struct LuxideState {
    pub render_manager: Arc<RenderManager>,
    pub auth_manager: Arc<AuthManager>,

    pub(crate) cookie_jar_key: Key,
}

impl LuxideState {
    pub fn new(
        render_manager: Arc<RenderManager>,
        auth_manager: Arc<AuthManager>,
        cookie_jar_key: Key,
    ) -> Self {
        Self {
            render_manager,
            auth_manager,
            cookie_jar_key,
        }
    }

    pub fn new_with_generated_key(
        render_manager: Arc<RenderManager>,
        auth_manager: Arc<AuthManager>,
    ) -> Self {
        Self::new(render_manager, auth_manager, Key::generate())
    }
}

impl FromRef<LuxideState> for Key {
    fn from_ref(state: &LuxideState) -> Self {
        state.cookie_jar_key.clone()
    }
}

impl JWTValidator for LuxideState {
    type Error = AuthManagerError;

    fn validate_jwt(&self, token: &str) -> Result<Claims, Self::Error> {
        self.auth_manager.validate_jwt(token)
    }
}
