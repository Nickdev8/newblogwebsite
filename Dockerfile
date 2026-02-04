# syntax=docker/dockerfile:1.7

FROM node:20-bookworm AS builder
WORKDIR /work
COPY app/package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY app/ ./
RUN npm run build

FROM node:20-bookworm AS runtime
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=builder /work/build ./build
COPY app/src/posts ./src/posts
COPY app/static ./static
RUN mkdir -p /app/data/fitbit
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
