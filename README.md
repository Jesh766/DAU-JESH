# GridTrade

GridTrade is a digital coordination, intelligence, marketplace, and
transaction-record layer for local renewable energy. It connects rooftop-solar
prosumers with nearby consumers while the existing electrical grid continues
to carry the electricity.

## What is implemented

- Premium control-room web experience with dashboard, marketplace, solar,
  grid, activity, and settings routes.
- Versioned Express REST API with generated React Query hooks and Zod
  validation.
- PostgreSQL-backed domain schema for users, solar systems, energy data,
  listings, trades, transactions, payments, SHA-256 hash records, grid data,
  AI predictions, and audit logs.
- Surplus calculation, listing ownership checks, availability validation,
  deterministic grid decisions, and multi-factor match scoring.
- Request IDs, structured pino logs, error envelopes, CORS, Helmet, security
  headers, and write rate limiting.
- Redis coordination boundary for caching, queues, rate limiting, and later
  event coordination.
- FastAPI boundary for future generation, demand, price, and anomaly models.
- Docker Compose for local PostgreSQL and Redis.

The first phase intentionally does not implement trained forecasting models,
blockchain, smart contracts, physical meter integrations, EV/V2G, or complex
payment gateways.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Start local services when working outside the managed development database:

   ```bash
   docker compose up -d postgres redis
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Apply the development database schema:

   ```bash
   pnpm --filter @workspace/db run push
   ```

5. Start the API and web workflows from the Replit workspace, or run the
   package commands directly with `PORT` and `BASE_PATH` set.

## Commands

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
pnpm run test
pnpm --filter @workspace/api-server run build
PORT=4173 BASE_PATH=/ pnpm --filter @workspace/gridtrade-web run build
```

## Architecture

The React web app calls the versioned API under `/api/v1`. The API is a
modular monolith: route handlers validate inputs and delegate domain rules.
PostgreSQL is durable source of truth. Redis is optional, temporary
coordination infrastructure. The AI service is intentionally separate so
Python models can evolve without splitting the core business API.

See:

- `docs/architecture/system-overview.md`
- `docs/architecture/domain-boundaries.md`
- `docs/api/api-conventions.md`
- `docs/security/security-baseline.md`
- `prisma/schema.prisma`
- `lib/db/src/schema/index.ts`