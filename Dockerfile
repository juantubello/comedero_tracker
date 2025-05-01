FROM node:18

# Instalar dependencias para compilar sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]