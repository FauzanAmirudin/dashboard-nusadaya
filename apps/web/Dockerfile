FROM node:20-alpine AS builder

WORKDIR /app

# Install libc6-compat for Alpine compatibility with native tools/turbopack
RUN apk add --no-cache libc6-compat

# Install bun for fast monorepo dependency installation
RUN npm install -g bun

# Copy package configurations
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Install all workspace dependencies
RUN bun install

# Copy the rest of the project
COPY . .

# Move into the web workspace
WORKDIR /app/apps/web

# Build arguments & environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build Next.js production bundle
RUN npx next build

# Expose standard Web internal port
EXPOSE 3000

# Start Next.js production server
CMD ["npx", "next", "start", "-p", "3000"]
