binary_name_api := 'luxide-api'
binary_name_cli := 'luxide-cli'

default:
    @just --list --justfile {{ justfile() }}

alias run := run-docker
[group('run')]
run-docker: build-api
    docker compose up -d --build

run-ui: run-docker setup-ui-env
    cd ui && npm run dev

[group('run')]
run-local: build-api run-postgres
    ./target/release/{{ binary_name_api }}

[group('run')]
run-cli: build-cli
    ./target/release/{{ binary_name_cli }}

[group('run')]
run-postgres:
    docker compose up -d postgres
    sqlx migrate run

[group('build')]
build: build-api-cli

[group('build')]
build-ui: setup-ui-env
    cd ui && npm run build

[group('build')]
build-api-cli: build-ui run-postgres
    cargo build --release

[group('build')]
build-api: build-ui run-postgres
    cargo build --release --bin {{ binary_name_api }}

[group('build')]
build-api-ci: build-ui
    cargo build --release --bin {{ binary_name_api }}

[group('build')]
build-cli:
    cargo build --release --bin {{ binary_name_cli }}

[group('validate')]
validate: cargo-check cargo-test cargo-clippy

[group('validate')]
cargo-check:
    cargo check --workspace
[group('validate')]
cargo-check-ci:
    SQLX_OFFLINE=true cargo check --no-default-features --workspace

[group('validate')]
cargo-test:
    cargo test --workspace
[group('validate')]
cargo-test-ci:
    SQLX_OFFLINE=true cargo test --no-default-features --workspace

[group('validate')]
cargo-clippy:
    cargo clippy --workspace -- -D clippy::correctness
[group('validate')]
cargo-clippy-ci:
    SQLX_OFFLINE=true cargo clippy --no-default-features --workspace -- -D clippy::correctness

[group('validate')]
lint-ui: setup-ui-env
    cd ui && npm run lint
[group('validate')]
lint-ui-ci:
    cd ui && npm run lint

[group('validate')]
typecheck-ui: setup-ui-env
    cd ui && npm run type-check
[group('validate')]
typecheck-ui-ci:
    cd ui && npm run type-check

[group('build')]
sqlx-prepare:
    cargo sqlx prepare

[group('misc')]
clean:
    cargo clean
    -rm -r ./ui/dist
    docker compose down

[group('misc')]
setup-ui-env:
    cd ui \
    && [ -s "$NVM_DIR/nvm.sh" ] \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install \
    && nvm use \
    && npm install

[group('misc')]
generate-jwt-keypair-pem:
    openssl genpkey -algorithm RSA -out jwt-key-private.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -in jwt-key-private.pem -pubout -out jwt-key-public.pem
