# Stage 1: build the tenant web SPA (Vite + React).
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Base URL of the public `root` API as seen from the browser.
# For local Docker deployment this is http://localhost:3000 (root's published port).
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL="$VITE_API_URL"

RUN pnpm run build

# Stage 2: serve the static SPA with nginx.
FROM nginx:alpine AS production

RUN apk add --no-cache wget

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
