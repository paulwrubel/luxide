binary_name_api := 'luxide-api'
binary_name_cli := 'luxide-cli'

default_profile := 'release'

default:
    @just --list --justfile {{justfile()}}

alias run := run-api
[group('run')]
run-api profile=default_profile: build-api run-postgres
    ./target/{{profile}}/{{binary_name_api}}

[group('run')]
run-cli profile=default_profile: build-cli
    ./target/{{profile}}/{{binary_name_cli}}

[group('run')]
run-postgres:
    docker compose up -d postgres

[group('build')]
build profile=default_profile: clean
    cargo build --{{profile}}

[group('build')]
build-api profile=default_profile: clean
    cargo build --{{profile}} --bin {{binary_name_api}}

[group('build')]
build-cli profile=default_profile: clean
    cargo build --{{profile}} --bin {{binary_name_cli}}

[group('misc')]
clean:
    cargo clean



