# GridTrade system overview

GridTrade is a digital coordination, intelligence, marketplace, and
transaction-record layer alongside the existing electrical grid. The platform
does not physically route electricity between homes.

## Runtime shape

```text
React/Vite web
       |
       v
Express REST API (/api/v1)
       |
       +--> PostgreSQL (durable domain state)
       +--> Redis (cache, queues, rate limits, event coordination)
       +--> FastAPI AI boundary (/v1/predictions)
```

The API is a modular monolith. Domain services are intentionally separate from
route handlers so matching, pricing, grid decisions, and settlement can grow
without a service split.

## Core workflow

Generate → Calculate Surplus → List → Discover Demand → Match → Price →
Check Grid → Confirm → Secure Settlement → SHA-256 Hash → Transaction Ledger

The current build establishes the entities, API boundaries, validation,
security middleware, and a representative control-room experience. It does not
claim to run physical meter integrations or a trained prediction model.