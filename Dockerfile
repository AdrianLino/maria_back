# --- Etapa 1: Builder ---
# Esta etapa instala todas las dependencias y construye tu aplicación.
FROM node:20-alpine AS builder

WORKDIR /app

# Copia los archivos de definición de paquetes.
COPY package*.json ./

# Instala todas las dependencias (incluidas las de desarrollo).
RUN npm install

# Copia el resto del código fuente.
COPY . .

# Ejecuta el script de construcción para generar la carpeta /dist.
RUN npm run build

# --- Etapa 2: Runner ---
# Esta etapa crea la imagen final y ligera para producción.
FROM node:20-alpine

WORKDIR /app

# Copia los archivos de definición de paquetes de nuevo.
COPY package*.json ./

# Instala ÚNICAMENTE las dependencias de producción.
RUN npm install --only=production

# Copia la aplicación ya construida desde la etapa 'builder'.
COPY --from=builder /app/dist ./dist

# Copia la carpeta de videos estáticos (necesaria para ServeStaticModule).
COPY --from=builder /app/videos ./videos

# Expone el puerto que tu aplicación NestJS usa (por defecto es 3000).
EXPOSE 3000

# El comando que se ejecutará para iniciar tu aplicación.
CMD ["node", "dist/main"]