# Endpoint – Architecture Overview

> A Postman-like REST API testing tool built with Next.js App Router, Prisma, PostgreSQL, Zustand, and TanStack Query.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via Docker) |
| ORM | Prisma |
| Auth | Better Auth |
| HTTP Client | Axios (server-side, inside Server Actions) |
| Client State | Zustand |
| Server State / Caching | TanStack React Query |
| UI | shadcn/ui + Tailwind CSS |
| Code Editor | Monaco Editor |
| Validation | Zod + React Hook Form |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/            # Sign-in page
│   └── (workspace)/       # Main app page (authenticated)
│       └── page.tsx       # Root layout: ResizablePanel(Playground | Sidebar)
├── actions/               # Next.js Server Actions (direct DB + Axios calls)
│   ├── requests/index.ts  # CRUD + sendRequest + run
│   ├── collections/       # Collection CRUD
│   ├── workspace/         # Workspace CRUD
│   └── authentication/    # currentUser helper
├── hooks/                 # TanStack Query wrappers (mutations + queries)
│   ├── requests/
│   ├── collections/
│   └── workspace/
├── store/                 # Zustand stores (ephemeral UI state)
│   ├── request/useRequestStore.ts   # Tabs, active tab, response data
│   └── workspaces/useWorkspaceStore.ts
├── components/
│   ├── requests/          # RequestPlayground, TabBar, RequestBar, RequestEditorArea
│   ├── response/          # ResponseViewer, BodyEditor, KeyValueFormEditor
│   ├── collections/       # Sidebar, CollectionFolder, CRUD modals
│   └── workspace/         # Workspace switcher
├── lib/
│   ├── db.ts              # Prisma singleton
│   ├── auth.ts            # Better Auth server config
│   └── auth-client.ts     # Better Auth browser client
└── providers/             # ReactQuery, Theme, HotKey providers
```

---

## Database Schema

```
User ──< Session
User ──< Account
User ──< WorkspaceMember >── Workspace
Workspace ──< Collection ──< Request ──< RequestRun (1:1, latest only)
```

### Key Models

```prisma
model Request {
  id           String      @id @default(cuid())
  name         String
  method       REST_METHOD @default(GET)   // GET|POST|PUT|DELETE|PATCH
  url          String
  parameters   String?     // JSON string: [{key, value, enabled}]
  headers      String?     // JSON string: [{key, value, enabled}]
  body         String?     // raw body string (JSON or plain text)
  response     String?     // last successful response body as string
  collectionId String
  runs         RequestRun[]
}

model RequestRun {
  id         String   @id @default(cuid())
  requestId  String   @unique          // 1:1 — only latest run is kept
  status     Int                       // HTTP status code (0 = failed)
  statusText String?
  headers    Json?                     // response headers as JSON object
  body       Json?                     // response body as JSON
  durationMs Int?
}
```

> **Important:** `parameters`, `headers`, and `body` on `Request` are stored as **JSON strings** (not native JSON columns). They are serialized/deserialized manually in the app. `RequestRun.headers` and `RequestRun.body` are native `Json` Prisma columns.

---

## State Management Split

| Concern | Tool | Why |
|---|---|---|
| Open tabs, active tab, in-flight edits | Zustand (`useRequestPlaygroundStore`) | Ephemeral, no server round-trip needed |
| Latest response data for the viewer | Zustand (`responseViewerData`) | Needs to survive re-renders, not persisted |
| Selected workspace | Zustand (`useWorkspaceStore`) | Global UI selection |
| Collections list, requests list | TanStack Query | Cached, auto-invalidated on mutations |
| Running/saving a request | TanStack Query mutation | Loading states, error toast, cache invalidation |

---

## Authentication Flow

Better Auth handles session management. `currentUser()` (a Server Action helper) reads the session from the request and returns the authenticated user. All workspace/collection actions call `currentUser()` before touching the DB.

---

## Planned Extensions

The architecture is designed to add:
- **WebSocket testing** – a new tab type and a different execution path (not Axios)
- **AI SDK integration** – a new tab type that routes through an AI provider
