use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use serde::Deserialize;

use crate::server::{AuthManager, Claims, LuxideState};
use crate::tracing::{Role, User, UserID};

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

/// Optional query parameter struct for admin user override.
/// Parses `?user_id=N` from the URL query string.
#[derive(Deserialize)]
#[serde()]
pub struct RequestedUserID {
    pub user_id: Option<UserID>,
}

/// Resolves the effective user ID for a request, handling the admin `?user_id=` override.
///
/// When `override_user_id` is `Some(id)`, verifies the requestor is an admin and the
/// target user exists. Returns the target ID on success. Non-admins receive 403.
/// When `None`, returns `claims.sub` (the authenticated user's own ID).
pub async fn resolve_effective_user_id(
    auth_manager: &AuthManager,
    claims: &Claims,
    requested_user_id: Option<UserID>,
) -> Result<UserID, (StatusCode, String)> {
    let requested_user_id = match requested_user_id {
        Some(user_id) => user_id,
        None => return Ok(claims.sub), // if no query parameter was set, just return from the JWT
    };

    // if a user_id parameter was added, we need to make sure that either...
    //
    // - the user_id matches the claims.sub field, or
    // - the user making the request (claims.sub) is an admin
    //
    // first we check if we even NEED to pull user info, by seeing if the QP matches the JWT's subject
    if claims.sub == requested_user_id {
        return Ok(claims.sub);
    }

    // if not, the user needs to be an admin to "simulate" another user
    let requestor_user = match auth_manager.get_user(claims.sub).await {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "User not found".to_string(),
            ));
        }
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to look up user".to_string(),
            ));
        }
    };

    // verify admin status
    if requestor_user.role != Role::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            "Only admins can use user_id parameter".to_string(),
        ));
    }

    // if we got here, we just need to make sure the requested user exists, and then we're good
    match auth_manager.get_user(requested_user_id).await {
        Ok(Some(user)) => Ok(user.id),
        Ok(None) => Err((StatusCode::NOT_FOUND, "Target user not found".to_string())),
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to look up target user".to_string(),
        )),
    }
}
