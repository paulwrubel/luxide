binary_name_api := 'luxide-api'
binary_name_cli := 'luxide-cli'

default:
    @just --list --justfile {{justfile()}}

alias run := run-docker
[group('run')]
run-docker: build-api
    docker compose up -d --build

[group('run')]
run-local: build-api run-postgres
    ./target/release/{{binary_name_api}}

[group('run')]
run-cli: build-cli
    ./target/release/{{binary_name_cli}}

[group('run')]
run-postgres:
    docker compose up -d postgres
    sqlx migrate run

[group('build')]
build: build-api-cli

[group('build')]
build-ui:
    cd ui && npm run build

[group('build')]
build-api-cli: build-ui run-postgres
    cargo build --release

[group('build')]
build-api: build-ui run-postgres
    cargo build --release --bin {{binary_name_api}}

[group('build')]
build-cli:
    cargo build --release --bin {{binary_name_cli}}

[group('misc')]
clean:
    cargo clean
    -rm -r ./ui/build
    docker compose down

generate-jwt-keypair-pem:
    openssl genpkey -algorithm RSA -out jwt-key-private.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -in jwt-key-private.pem -pubout -out jwt-key-public.pem



