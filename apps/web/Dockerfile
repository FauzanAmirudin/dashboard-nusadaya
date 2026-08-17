FROM node:20-alpine AS builder

WORKDIR /app

# Install bun for fast dependency installation
RUN npm install -g bun

# Copy package configurations
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Install all dependencies
RUN bun install

# Copy the rest of the project
COPY . .

# Move into the web directory
WORKDIR /app/apps/web

# Set environment variable for build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build Next.js with official Node runtime (prevents Bun SIGILL/segfault on VPS CPUs)
RUN npx next build

# Expose Web port
EXPOSE 3000

# Start Next.js production server
CMD ["npx", "next", "start", "-p", "3000"]
