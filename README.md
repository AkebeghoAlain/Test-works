# CamTicket - Event Booking & QR Verification Platform

Production-grade full-stack starter for Cameroon-focused event ticketing with international expansion readiness.

## Stack
- **Frontend**: Next.js App Router, TypeScript, TailwindCSS, Recharts, PWA.
- **Backend**: Express + TypeScript, Prisma ORM, PostgreSQL, JWT auth, RBAC, HMAC QR verification.
- **Infra**: Docker, Redis-ready cache support, Vercel/Railway/Render/AWS deployment friendly.

## Monorepo Structure
```txt
apps/
  backend/
    src/
      modules/
        auth events tickets payments wallet scanner admin analytics
  frontend/
    app/
      (auth)/login dashboard events scanner admin
prisma/schema.prisma
.env.example
docker/docker-compose.yml
```

## Core Features Included
- Email/password auth + phone OTP verification endpoint.
- Roles: `USER`, `ORGANIZER`, `ADMIN` with RBAC middleware.
- Organizer event CRUD with capacity, status, ticket categories.
- Ticket ordering with max-per-user validation and anti-oversell DB transaction.
- Payment abstraction/webhook endpoint (MTN, Orange, Bank, Flutterwave enums).
- Wallet crediting + withdrawal request lifecycle.
- HMAC-signed QR verification and single-use ticket enforcement.
- Scan endpoint rate limiting.
- Organizer analytics endpoint for dashboard charts.
- Responsive mobile-first frontend with bottom nav and desktop sidebar.
- PWA support (`manifest.json`, next-pwa service worker generation).

## API Routes (Backend)
| Area | Method | Path |
|---|---|---|
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Auth | POST | `/api/auth/phone/verify-otp` |
| Events | GET | `/api/events` |
| Events | POST/PATCH/DELETE | `/api/events` |
| Tickets | POST | `/api/tickets/orders` |
| Tickets | POST | `/api/tickets/issue/:orderId` |
| Scanner | POST | `/api/scanner/verify` |
| Payments | POST | `/api/payments/webhook` |
| Wallet | GET/POST | `/api/wallet/me`, `/api/wallet/withdrawals` |
| Admin | POST/GET | `/api/admin/*` |
| Analytics | GET | `/api/analytics/organizer` |

## Setup
1. Install deps:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client + migrate:
   ```bash
   npm run prisma:generate -w @camticket/backend
   npx prisma migrate dev --schema prisma/schema.prisma
   ```
4. Run:
   ```bash
   npm run dev
   ```

## Deployment
- **Frontend**: Vercel (`apps/frontend`).
- **Backend**: Railway/Render/AWS container using `apps/backend/Dockerfile`.
- **Local containers**:
  ```bash
  docker compose -f docker/docker-compose.yml up --build
  ```

## Security Checklist (Implemented)
- JWT access/refresh model.
- RBAC middleware guards.
- HMAC signed QR with timing-safe comparison.
- Payment webhook signature verification.
- Scan endpoint rate limiting.
- Zod input validation.
- Transaction-based oversell protection.
