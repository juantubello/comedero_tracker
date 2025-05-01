FROM node:18

# Instalar dependencias para compilar sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar el resto de tu código
WORKDIR /app
COPY . .

# Instalar dependencias de npm, incluyendo sqlite3
RUN npm install

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]