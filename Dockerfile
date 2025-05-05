FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY target/release/luxide-api /app/

EXPOSE 8080
CMD ["/app/luxide-api"]
