# Hop Framework Docker Image
# Build: docker build -t hop-framework .
# Run:   docker run -v $(pwd):/app hop-framework

FROM oven/bun:1-alpine

LABEL maintainer="hop-framework"
LABEL description="Hop BDD Testing Framework Runner"

# Install dependencies
RUN apk add --no-cache \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    tzdata

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production \
    HOP_ENV=docker \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROMIUM_PATH=/usr/bin/chromium-browser

# Expose default ports
EXPOSE 3000 3001 9229

# Default command
CMD ["bun", "run", "bin/cli.ts", "--help"]

# Labels for container labels
LABEL "org.opencontainers.image.title"="Hop Framework"
LABEL "org.opencontainers.image.description"="BDD Testing Framework with Gherkin"
LABEL "org.opencontainers.image.version"="1.0.0"
