FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY src/ ./src/

# Run migrations on start
CMD node src/db/migrate.js && node src/db/seed.js && node src/server.js
