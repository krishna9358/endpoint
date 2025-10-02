# getme

Modern Next.js app with Postgres (Docker) + Prisma, Tailwind CSS v4, ESLint/Prettier, and Better Auth.

## Tech Stack

- **Framework**: `next@15`, `react@19`
- **DB & ORM**: Postgres (Docker) + Prisma
- **Auth**: `better-auth`
- **UI**: Tailwind CSS v4, Radix UI + shadcn components, Lucide icons
- **Tooling**: ESLint, Prettier, TypeScript

## Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for the Postgres container)

## Quick Start

1. Install deps:
   ```bash
   npm install
   ```
2. Configure env (create a `.env` file in project root):

   ```bash
   # Database
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

   # App base URL for auth client (adjust when deploying)
   BASE_URL="http://localhost:3000"
   ```

3. Start dev (spins up Postgres via Docker and Next.js):
   ```bash
   npm run dev
   ```
4. Run initial Prisma setup in another terminal:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   # Optional: open Prisma Studio
   npx prisma studio
   ```

## Available Scripts

- **dev**: `docker-compose up -d && next dev --turbopack`
- **build**: `next build --turbopack`
- **start**: `next start`
- **lint**: `eslint`
- **prettier**: `npx prettier . --write`
- **prettier:check**: `npx prettier . --check`

## Database (Docker)

Docker service defined in `docker-compose.yaml`:

- Image: `postgres:latest`
- Connection: `postgres://postgres:postgres@localhost:5432/postgres`
  Ensure Docker is running before `npm run dev`.

## Notes

- Server runs at `http://localhost:3000`.
- Update `BASE_URL` when deploying (e.g., Vercel URL) so `src/lib/auth-client.ts` can use it.
- Prisma is configured in `prisma/schema.prisma` with provider `postgresql` and `DATABASE_URL` from env.
