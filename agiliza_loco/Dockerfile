# Dockerfile de Execucao Direta (Binario Rust Compilado Localmente)
FROM debian:bookworm-slim
WORKDIR /app

# Instalar dependencias de execucao ultraleves
RUN apt-get update && apt-get install -y ca-certificates libssl3 sqlite3 && rm -rf /var/lib/apt/lists/*

# Copiar o binario compilado localmente em modo release
COPY target/release/agiliza_loco-cli /app/agiliza_loco-cli
COPY config /app/config

EXPOSE 5150
ENV PORT 5150

CMD ["/app/agiliza_loco-cli", "start"]
