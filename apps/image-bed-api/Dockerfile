FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/blog/package.json apps/blog/package.json
COPY apps/image-bed-api/package.json apps/image-bed-api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build -w @woodfish-nest/shared
RUN npm run build -w @woodfish-nest/image-bed-api

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/image-bed-api/dist ./apps/image-bed-api/dist
COPY --from=build /app/apps/image-bed-api/migrations ./apps/image-bed-api/migrations
COPY --from=build /app/apps/image-bed-api/package.json ./apps/image-bed-api/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
WORKDIR /app/apps/image-bed-api
EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
