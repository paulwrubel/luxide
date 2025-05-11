use axum::{
    Json,
    extract::{Query, State},
    response::{IntoResponse, Response},
};
use axum_extra::extract::{SignedCookieJar, cookie::Cookie};
use serde::{Deserialize, Serialize};

use crate::server::LuxideState;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct LoginQueryParameters {
    origin: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct LoginResponse {
    redirect_url: String,
}

pub async fn auth_login(
    State(state): State<LuxideState>,
    Query(query_parameters): Query<LoginQueryParameters>,
    cookie_jar: SignedCookieJar,
) -> Response {
    println!("Handing request for auth_login...");

    let session_id = uuid::Uuid::new_v4();
    let session_id_cookie = Cookie::build(("session_id", session_id.to_string()))
        .path("/")
        .secure(true)
        .http_only(true);

    let (url, auth_state) = state
        .auth_manager
        .get_auth_url_and_state(query_parameters.origin);

    state
        .auth_manager
        .set_state_for_session_id(session_id, auth_state);

    // (cookie_jar.add(session_id_cookie), Redirect::temporary(&url)).into_response()

    (
        cookie_jar.add(session_id_cookie),
        Json(LoginResponse { redirect_url: url }),
    )
        .into_response()
}
