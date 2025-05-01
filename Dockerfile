# Usa la imagen específica para ARM (Raspberry Pi)
FROM --platform=linux/arm64 node:18-slim

# Instala dependencias para compilar módulos nativos
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Configura el directorio de trabajo
WORKDIR /app

# Copia primero los archivos de dependencias para cachear npm install
COPY package.json package-lock.json ./

# Instala dependencias limpiando cache para reducir tamaño de imagen
RUN npm ci --production \
    && npm cache clean --force

# Copia el resto de los archivos de la aplicación
COPY . .

# Compila sqlite3 específicamente para ARM
RUN npm rebuild sqlite3 --build-from-source

# Expone el puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]