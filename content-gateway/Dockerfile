FROM node:22-alpine AS build

WORKDIR /app/content-gateway
COPY content-gateway/package.json content-gateway/package-lock.json* ./
RUN npm ci
RUN ln -s /app/content-gateway/node_modules /app/node_modules

COPY content-gateway .
COPY shared ../shared
RUN npm run build

FROM node:22-alpine
WORKDIR /app/content-gateway

COPY content-gateway/package.json content-gateway/package-lock.json* ./
RUN npm ci --omit=dev
RUN ln -s /app/content-gateway/node_modules /app/node_modules

COPY --from=build /app/content-gateway/dist ./dist

EXPOSE 5100
CMD ["node", "dist/content-gateway/src/server.js"]
