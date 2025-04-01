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
build: clean
    cargo build --release

[group('build')]
build-api: clean
    cargo build --release --bin {{binary_name_api}}

[group('build')]
build-cli: clean
    cargo build --release --bin {{binary_name_cli}}

[group('misc')]
clean:
    cargo clean



