# Hop Framework Docker Image
# Build: docker build -t hop-framework .
# Run:   docker run -v $(pwd):/app hop-framework test

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
    tzdata \
    openssl \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Install Playwright browsers
RUN bun add -i playwright && \
    playwright install chromium --with-deps || true

# Create directories
RUN mkdir -p features steps reports hooks screenshots videos

# Set environment variables
ENV NODE_ENV=production \
    HOP_ENV=docker \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    HOP_FEATURES=/app/features \
    HOP_STEPS=/app/steps \
    HOP_REPORTS=/app/reports \
    HOP_TIMEOUT=30000

# Expose default ports
EXPOSE 3000 3001 9229

# Default command
CMD ["bun", "run", "bin/cli.ts", "test"]

# Labels for container labels
LABEL "org.opencontainers.image.title"="Hop Framework"
LABEL "org.opencontainers.image.description"="BDD Testing Framework with Gherkin"
LABEL "org.opencontainers.image.version"="1.0.0"
