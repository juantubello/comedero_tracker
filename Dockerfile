# Usa una imagen base de Node.js
FROM node:18

# Instalar las herramientas necesarias para compilar sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app