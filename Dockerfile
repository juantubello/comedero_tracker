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

# Copia los archivos de configuración de npm (package.json y package-lock.json)
COPY package*.json ./

# Instala las dependencias dentro del contenedor
RUN npm install

# Copia el resto de los archivos del proyecto dentro del contenedor
COPY . .

# Expone el puerto en el que corre tu servidor (ajústalo si es necesario)
EXPOSE 3000

# Comando para correr la aplicación cuando el contenedor se ejecute
CMD ["node", "server.js"]