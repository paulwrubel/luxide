use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};

use crate::server::{Claims, LuxideState};
use crate::tracing::{Role, User};

/// Extractor that validates the user is an admin.
/// Wraps the existing Claims extractor, fetches the full User from DB,
/// and returns 403 Forbidden if the user is not an admin.
pub struct AdminUser {
    pub user: User,
}

impl FromRequestParts<LuxideState> for AdminUser {
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &LuxideState,
    ) -> Result<Self, Self::Rejection> {
        // Extract Claims (reuses the existing JWT validator via LuxideState)
        let claims = Claims::from_request_parts(parts, state).await?;

        // Look up the user from the database
        let user = state
            .auth_manager
            .get_user(claims.sub)
            .await
            .map_err(|_| {
                (StatusCode::INTERNAL_SERVER_ERROR, "Failed to look up user").into_response()
            })?
            .ok_or_else(|| (StatusCode::INTERNAL_SERVER_ERROR, "User not found").into_response())?;

        // Check admin role
        if user.role != Role::Admin {
            return Err((StatusCode::FORBIDDEN, "Admin access required").into_response());
        }

        Ok(AdminUser { user })
    }
}
