FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | sh
ENV PATH="/root/.local/share/mise/shims:/root/.local/bin:${PATH}"

WORKDIR /app
COPY mise.toml .
RUN mise trust && mise install

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG LINGQ_API_KEY
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV LINGQ_API_KEY=$LINGQ_API_KEY

RUN mkdir -p data && pnpm build


FROM node:22-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates ffmpeg python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | sh
ENV PATH="/root/.local/share/mise/shims:/root/.local/bin:${PATH}"

WORKDIR /app
COPY mise.toml .
RUN mise trust && mise install

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts ./
COPY scripts/migrate.ts ./scripts/migrate.ts

EXPOSE 3000
# Run migrations via a direct migrator import rather than `drizzle-kit migrate`,
# because the drizzle-kit CLI swallows migration errors (prints success and
# exits 0 even when migrate() throws). scripts/migrate.ts propagates errors
# and exits non-zero so the container refuses to start on failure.
CMD ["sh", "-c", "pnpm exec tsx scripts/migrate.ts && pnpm start"]
