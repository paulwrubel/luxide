use axum::{
    extract::State,
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};

use super::LuxideState;

pub async fn auth_login(State(_render_manager): LuxideState) -> Response {
    println!("Handing request for auth_login...");

    let client_id = std::env::var("GITHUB_CLIENT_ID").expect("GITHUB_CLIENT_ID not set");

    let redirect_url = format!(
        "https://github.com/login/oauth/authorize?client_id={}",
        client_id
    );

    (
        StatusCode::TEMPORARY_REDIRECT,
        [(header::LOCATION, redirect_url)],
    )
        .into_response()
}
