# syntax=docker/dockerfile:1.7

# ===== Builder =====
FROM node:20-bookworm AS builder
WORKDIR /work

# Detect package manager; default to npm
# If you use pnpm, we will install it for the build
ARG PM=npm

# Copy lockfiles first for better layer caching
# Copy both in case one exists. They will overwrite each other only if present.
COPY app/package.json ./
COPY app/package-lock.json ./  || true
COPY app/pnpm-lock.yaml ./     || true

# Install dependencies (including dev) based on the lockfile
# If pnpm lockfile exists, use pnpm
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    else \
      npm ci --omit=dev=false; \
    fi

# Copy the full source and build
COPY app/ ./

# Ensure you use @sveltejs/adapter-node in svelte.config.js
# Typical build command
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm run build; \
    else \
      npm run build; \
    fi

# ===== Runtime =====
FROM node:20-bookworm AS runtime
# Create an unprivileged user
RUN useradd -r -s /usr/sbin/nologin nodeuser
WORKDIR /app

# Copy only production deps
COPY app/package.json ./
COPY app/package-lock.json ./  || true
COPY app/pnpm-lock.yaml ./     || true

RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod --frozen-lockfile; \
    else \
      npm ci --omit=dev; \
    fi

# Bring in the build output
COPY --from=builder /work/build ./build

# Environment expected by adapter-node
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# If your app needs environment variables at runtime,
# mount or copy an .env.production and read it in your app.

USER nodeuser
EXPOSE 3000
CMD ["node", "build"]
