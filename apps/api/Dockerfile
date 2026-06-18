FROM oven/bun:1

WORKDIR /app

# Copy package configurations
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Install all dependencies (workspaces requires all to be present)
RUN bun install

# Copy the rest of the project
COPY . .

# Move into the api directory
WORKDIR /app/apps/api

# Expose API port
EXPOSE 3001

# Start the API using Bun
CMD ["bun", "run", "src/index.ts"]
