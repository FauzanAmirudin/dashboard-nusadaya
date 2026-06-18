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

# Move into the web directory
WORKDIR /app/apps/web

# Set environment variable for build time (if provided)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js application
RUN bun run build

# Expose Web port
EXPOSE 3000

# Start the Next.js server
CMD ["bun", "run", "start"]
