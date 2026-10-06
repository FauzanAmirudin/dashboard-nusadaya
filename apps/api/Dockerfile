FROM oven/bun:1

WORKDIR /app

# Copy package configurations
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Install all workspace dependencies
RUN bun install

# Copy the rest of the project
COPY . .

# Ensure storage and backups directories exist
RUN mkdir -p /app/storage /app/backups

# Move into the api workspace
WORKDIR /app/apps/api

# Expose standard API internal port
EXPOSE 3001

# Start the API service using Bun
CMD ["bun", "run", "src/index.ts"]
