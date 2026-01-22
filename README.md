# Web Framework

## Requirements

- Node 18.19.0
- pnpm 8.15.4

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and update values.

3. Run database migrations and seed (API):

```bash
pnpm --filter @web-framework/api prisma migrate dev
pnpm --filter @web-framework/api prisma db seed
```

## Commands

- `pnpm dev`
- `pnpm test`
- `pnpm build`
- `pnpm lint`
