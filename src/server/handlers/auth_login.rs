use axum::{
    extract::State,
    response::{IntoResponse, Redirect, Response},
};
use axum_extra::extract::{SignedCookieJar, cookie::Cookie};

use crate::server::LuxideState;

pub async fn auth_login(State(state): State<LuxideState>, cookie_jar: SignedCookieJar) -> Response {
    println!("Handing request for auth_login...");

    let session_id = uuid::Uuid::new_v4();
    let session_id_cookie = Cookie::build(("session_id", session_id.to_string()))
        .path("/")
        .secure(true)
        .http_only(true);

    let (url, auth_state) = state.auth_manager.get_auth_url_and_state();

    println!(
        "Generated SessionID: {}! Generated state: {}!",
        session_id.to_string(),
        auth_state.secret()
    );

    state
        .auth_manager
        .set_state_for_session_id(session_id, auth_state);

    (cookie_jar.add(session_id_cookie), Redirect::temporary(&url)).into_response()
}
