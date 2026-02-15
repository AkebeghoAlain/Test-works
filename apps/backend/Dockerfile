FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm install
COPY . .
RUN npm run build -w @camticket/backend
EXPOSE 5000
CMD ["npm", "run", "start", "-w", "@camticket/backend"]
