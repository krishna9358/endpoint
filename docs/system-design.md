# Endpoint — System Design

## 1. Problem Statement

API clients like Postman solve a daily problem for backend engineers: compose HTTP requests, organize them in collections, execute them, and inspect responses. Endpoint recreates that workflow as a full stack web application so the author (and users) can learn how such tools are structured end to end.

## 2. Goals & Non-Goals

### Goals

- Multi-tenant workspaces with collections and persisted requests
- Tabbed request editor (method, URL, params, headers, body)
- Server-side HTTP execution with timing and response persistence
- OAuth authentication and per-user data isolation
- WebSocket testing from the browser
- AI helpers for naming requests and generating JSON bodies

### Non-Goals (current version)

- Team collaboration beyond workspace membership schema
- Environment variables / secrets vault
- Collection import/export (Postman format)
- Running unsaved drafts without a persisted `requestId` (noted as TODO in code)
- Server-side WebSocket proxy (WS is direct browser → target)

## 3. High-Level Architecture

Endpoint is a **monolithic Next.js application** with:

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| UI | React 19, Tailwind v4, Radix/shadcn | Playground, sidebar, modals, Monaco editor |
| Client state | Zustand | Ephemeral tabs, active workspace, WebSocket connection |
| Server cache | TanStack React Query | Server action results, invalidation on mutations |
| Application logic | Next.js Server Actions | CRUD, HTTP proxy, auth checks |
| HTTP proxy | Axios (Node, server only) | Outbound API calls from server |
| Auth | Better Auth + Prisma adapter | Sessions, OAuth |
| AI | Vercel AI SDK + `@ai-sdk/google` | Structured Gemini outputs |
| Data | PostgreSQL + Prisma | Users, workspaces, requests, run history |

**Deployment shape:** single Next.js process + Postgres container (`docker compose` in dev).

## 4. Core Components

### 4.1 Request Playground (REST)

- **Zustand store** (`useRequestPlaygroundStore`): in-memory tabs; each tab holds method, URL, headers/parameters/body as JSON strings, `unsavedChanges`, and optional `requestId` after save.
- **RequestPlayground**: orchestrates tabs, keyboard shortcuts (`Cmd+S` save, `Cmd+Shift+G` new tab).
- **RequestEditor**: request bar + editor area + response viewer.
- **Persistence**: only saved requests (with `requestId`) can be executed via `run()` today; Send uses `useRunRequest(requestId)`.

### 4.2 Collections Sidebar

- Scoped to **selected workspace** (`useWorkspaceStore`).
- **React Query** loads collections and nested requests per collection.
- Opening a request calls `openRequestTab()` — deduplicates by `requestId`.

### 4.3 HTTP Execution Engine

`sendRequest()` in server actions:

1. Builds Axios config from method, URL, headers, body, query params.
2. Measures `durationMs` and response `size`.
3. Returns success payload or `{ error, durationMs }` on failure.

`run(requestId)`:

1. Loads request from DB.
2. Calls `sendRequest`.
3. **Upserts** `RequestRun` (one row per request via `@@unique([requestId])`).
4. On success, stores stringified response on `Request` for quick replay.

**Design choice:** server-side proxy avoids CORS in the browser and mirrors how many API tools proxy or run requests from a desktop agent. Tradeoff: server egress IP is used, not the user's machine.

### 4.4 Authentication & Authorization

- **Better Auth** with GitHub and Google providers; Prisma stores `User`, `Session`, `Account`.
- **Workspace access**: `getWorkspaces` returns workspaces where user is owner or `WorkspaceMember`.
- **Development shortcut**: `currentUser()` returns/creates a dev user without OAuth when `NODE_ENV === development`.

### 4.5 WebSocket Module (`/ws`)

- **Client-only** via `useWsStore`: connect, disconnect, auto-reconnect, message log.
- No persistence to Postgres; state lives in Zustand for the session.

### 4.6 AI Subsystem

| Endpoint | Agent function | Output |
|----------|----------------|--------|
| `POST /api/ai/suggest-name` | `suggestRequestName` | 3 named suggestions with confidence |
| `POST /api/ai/generate-body` | `generateJsonBody` | JSON body + explanation + alternates |

Uses `generateObject` with Zod schemas and **Gemini 3.1 Flash Lite**. API routes are thin; logic lives in `src/lib/ai-agents.ts`.

## 5. Data Model Summary

```
User
  └── Workspace (owner)
        └── WorkspaceMember (ADMIN | EDITOR | VIEWER)
        └── Collection
              └── Request (method, url, headers, body, parameters, response snapshot)
                    └── RequestRun (status, headers JSON, body JSON, durationMs) [1:1]
```

Headers, parameters, and body on `Request` are stored as **strings** (JSON serialized from key-value UI). This keeps the schema simple but pushes parsing to the application layer.

## 6. Key User Flows

### 6.1 First visit

1. User signs in → Better Auth creates session.
2. Workspace layout calls `initializeWorkspace()` → upserts "Personal Workspace".
3. User selects workspace in header → collections load for that workspace.

### 6.2 Create and run a request

1. New tab → edit URL, params, headers, body.
2. Save to collection → `addRequestToCollection` → tab gets `requestId`.
3. Send → `run(requestId)` → Axios → DB → response panel.

### 6.3 AI-assisted workflow

1. Save modal or rename modal calls suggest-name API with workspace + method + URL context.
2. Body editor "sparkle" flow calls generate-body API with natural language prompt.

## 7. Cross-Cutting Concerns

### 7.1 State management split

| Concern | Tool | Why |
|---------|------|-----|
| Tab UX, WS connection | Zustand | Fast local updates, no server round-trip |
| Server-backed lists | React Query | Cache, invalidation, loading/error states |

### 7.2 Error handling

- Server actions often `console.log` and return `undefined` on failure; hooks surface toast errors.
- HTTP failures still create/update `RequestRun` with `status: 0` and error body JSON.

### 7.3 Security considerations

- OAuth secrets and `GOOGLE_GENERATIVE_AI_API_KEY` in env only.
- Server actions should validate `currentUser()` before mutations (workspace actions do; request actions rely on IDs — hardening opportunity).
- SSRF risk: server Axios can call arbitrary URLs users provide — production should add allowlists or network policies.

## 8. Scalability & Evolution

| Area | Today | Future direction |
|------|-------|------------------|
| HTTP runs | Sync in server action | Job queue for long requests |
| RequestRun | One row per request (upsert) | Append-only run history |
| Draft send | Requires saved `requestId` | `sendRequest` from tab without DB |
| Multi-user | Schema supports members | Invite UI, role enforcement |
| WS | Browser direct | Optional server relay for corporate networks |

## 9. Tech Stack

Next.js 16, React 19, TypeScript, PostgreSQL, Prisma, Better Auth, TanStack React Query, Zustand, Axios, Tailwind CSS v4, Radix UI, Monaco Editor, Vercel AI SDK, Google Gemini, Docker Compose, Bun/npm tooling.

## 10. Mental Model (Postman Parity)

| Postman concept | Endpoint implementation |
|-----------------|-------------------------|
| Workspace | `Workspace` + `useWorkspaceStore` |
| Collection | `Collection` + sidebar |
| Request | `Request` + Zustand tab |
| Send | `run()` + Axios server proxy |
| History | `RequestRun` (single latest per request) |
| WebSocket tab | `/ws` + `useWsStore` |
| AI features | Gemini via `/api/ai/*` |
