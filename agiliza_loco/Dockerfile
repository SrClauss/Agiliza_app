# Dockerfile com Ubuntu 24.04 para suporte a GLIBC 2.38+ do binario compilado localmente
FROM ubuntu:24.04
WORKDIR /app

# Instalar dependencias de execucao ultraleves
RUN apt-get update && apt-get install -y ca-certificates libssl-dev sqlite3 && rm -rf /var/lib/apt/lists/*

# Copiar o binario compilado localmente em modo release
COPY target/release/agiliza_loco-cli /app/agiliza_loco-cli
COPY config /app/config

EXPOSE 5150
ENV PORT 5150

CMD ["/app/agiliza_loco-cli", "start"]
