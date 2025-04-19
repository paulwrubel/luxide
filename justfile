binary_name_api := 'luxide-api'
binary_name_cli := 'luxide-cli'

default:
    @just --list --justfile {{justfile()}}

alias run := run-api
[group('run')]
run-api: build-api run-postgres
    ./target/release/{{binary_name_api}}

[group('run')]
run-cli: build-cli
    ./target/release/{{binary_name_cli}}

[group('run')]
run-postgres:
    docker compose up -d postgres

[group('build')]
build:
    cargo build --release

[group('build')]
build-api:
    cargo build --release --bin {{binary_name_api}}

[group('build')]
build-cli:
    cargo build --release --bin {{binary_name_cli}}

[group('misc')]
clean:
    cargo clean

generate-jwt-keypair-pem:
    openssl genpkey -algorithm RSA -out jwt-key-private.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -in jwt-key-private.pem -pubout -out jwt-key-public.pem



