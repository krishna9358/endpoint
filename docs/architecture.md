# Endpoint — Architecture & Data Flow

Endpoint is a Postman-style API client: workspaces, collections, saved HTTP requests, server-side proxy execution, response history, WebSocket testing, and AI-assisted naming and JSON body generation.

## High-Level Technical Architecture

```mermaid
flowchart TB
    subgraph Client["Browser (React 19)"]
        UI[UI Components<br/>shadcn / Radix / Tailwind]
        ZS[Zustand Stores<br/>tabs, workspace, WebSocket]
        RQ[TanStack React Query<br/>mutations & cache]
    end

    subgraph NextApp["Next.js 16 App Router"]
        Pages[Workspace Pages<br/>/ and /ws]
        SA[Server Actions<br/>requests, collections, workspace]
        API[Route Handlers<br/>/api/auth, /api/ai/*]
        AuthLib[Better Auth]
        AI[AI Agents<br/>Vercel AI SDK + Gemini]
    end

    subgraph Data["Persistence"]
        PG[(PostgreSQL<br/>Docker)]
        Prisma[Prisma ORM]
    end

    subgraph External["External Services"]
        TargetAPI[Target REST APIs]
        OAuth[GitHub / Google OAuth]
        Gemini[Google Generative AI]
        WSServer[WebSocket Servers]
    end

    UI --> ZS
    UI --> RQ
    RQ --> SA
    RQ --> API
    Pages --> UI
    SA --> Prisma
    API --> AI
    AuthLib --> Prisma
    Prisma --> PG
    SA -->|axios proxy| TargetAPI
    AuthLib --> OAuth
    AI --> Gemini
    ZS -->|native WebSocket| WSServer
```

## Layered Architecture

```mermaid
flowchart LR
    subgraph Presentation
        A[Request Playground]
        B[Collections Sidebar]
        C[WebSocket Panel]
        D[Monaco Body Editor]
    end

    subgraph State
        E[useRequestPlaygroundStore]
        F[useWorkspaceStore]
        G[useWsStore]
    end

    subgraph Application
        H[React Query Hooks]
        I[Server Actions]
        J[API Routes]
    end

    subgraph Domain
        K[Workspace / Collection / Request]
        L[RequestRun history]
    end

    subgraph Infrastructure
        M[Prisma + Postgres]
        N[Axios HTTP client]
        O[Better Auth sessions]
    end

    A --> E
    B --> H
    C --> G
    D --> A
    H --> I
    H --> J
    I --> K
    I --> N
    K --> M
    I --> L
    O --> M
```

## HTTP Request Execution Data Flow

This is the core “Send” path: the browser never calls the target API directly; the server action proxies the call and persists the result.

```mermaid
sequenceDiagram
    actor User
    participant RB as RequestBar (Client)
    participant Hook as useRunRequest
    participant Run as run() Server Action
    participant DB as PostgreSQL
    participant Axios as Axios (Server)
    participant API as External API
    participant Store as Zustand
    participant RV as ResponseViewer

    User->>RB: Click Send
    RB->>Hook: mutateAsync()
    Hook->>Run: run(requestId)
    Run->>DB: findUnique(Request)
    Run->>Axios: sendRequest(method, url, headers, body, params)
    Axios->>API: HTTP request
    API-->>Axios: response
    Axios-->>Run: status, headers, body, durationMs
    Run->>DB: upsert RequestRun
    Run->>DB: update Request.response (on success)
    Run-->>Hook: { success, requestRun, response }
    Hook->>Store: setResponseViewerData(data)
    Store->>RV: render status, body, timing
```

## CRUD & Collection Data Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Playground / Modals
    participant RQ as React Query
    participant SA as Server Actions
    participant DB as PostgreSQL

    User->>UI: Save request (Cmd+S)
    UI->>RQ: useSaveRequest / useAddRequestToCollection
    RQ->>SA: saveRequest / addRequestToCollection
    SA->>DB: create or update Request
    SA-->>RQ: saved Request
    RQ->>UI: invalidate ["requests"] + sync tab from DB

    User->>UI: Open collection item
    UI->>RQ: useGetRequests(collectionId)
    RQ->>SA: getRequests
    SA->>DB: findMany by collectionId
    SA-->>UI: list of requests
    UI->>UI: openRequestTab() in Zustand
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant SignIn as /sign-in
    participant AuthAPI as /api/auth/[...all]
    participant BA as Better Auth
    participant DB as PostgreSQL

    User->>SignIn: GitHub or Google
    SignIn->>AuthAPI: OAuth callback
    AuthAPI->>BA: session + account
    BA->>DB: User, Session, Account

    Note over SignIn,DB: Dev mode: currentUser() returns first DB user without session

    User->>SignIn: Enter workspace
    SignIn->>BA: getSession (production)
    BA->>DB: validate session
```

## AI Assistance Data Flow

```mermaid
sequenceDiagram
    actor User
    participant Modal as Rename / Body Editor
    participant Hook as useAiSuggestion hooks
    participant Route as /api/ai/*
    participant Agent as ai-agents.ts
    participant Gemini as Gemini 3.1 Flash Lite

    User->>Modal: Suggest name or generate JSON
    Modal->>Hook: POST with context
    Hook->>Route: suggest-name | generate-body | generate-json
    Route->>Agent: generateObject (Zod schema)
    Agent->>Gemini: structured output
    Gemini-->>Agent: suggestions / JSON body
    Agent-->>Modal: apply to tab or editor
```

## WebSocket Testing Flow (Client-Side Only)

```mermaid
sequenceDiagram
    actor User
    participant Bar as ConnectionBar
    participant WS as useWsStore (Zustand)
    participant Socket as Browser WebSocket
    participant Server as Remote WS Server
    participant Log as Message Log Table

    User->>Bar: Enter ws:// URL + Connect
    Bar->>WS: connect(url)
    WS->>Socket: new WebSocket(url)
    Socket->>Server: handshake
    Server-->>Socket: open
    User->>Bar: Send message
    WS->>Socket: send(payload)
    Socket->>Server: frame
    Server-->>Socket: message
    WS->>Log: addMessage(received)
```

## Entity Relationship (Data Model)

```mermaid
erDiagram
    User ||--o{ Workspace : owns
    User ||--o{ WorkspaceMember : joins
    Workspace ||--o{ WorkspaceMember : has
    Workspace ||--o{ Collection : contains
    Collection ||--o{ Request : contains
    Request ||--o| RequestRun : "latest run"
    User ||--o{ Session : has
    User ||--o{ Account : has

    User {
        string id PK
        string email
        string name
    }
    Workspace {
        string id PK
        string name
        string ownerId FK
    }
    Collection {
        string id PK
        string name
        string workspaceId FK
    }
    Request {
        string id PK
        string method
        string url
        string headers
        string body
        string parameters
        string response
    }
    RequestRun {
        string id PK
        int status
        json headers
        json body
        int durationMs
    }
```

## App Routes Map

| Route | Purpose |
|-------|---------|
| `/sign-in` | OAuth login (GitHub, Google) |
| `/` | REST playground + collections sidebar |
| `/ws` | WebSocket client tester |
| `/api/auth/[...all]` | Better Auth handler |
| `/api/ai/suggest-name` | AI request naming |
| `/api/ai/generate-body` | AI JSON body generation |
| `/api/ai/generate-json` | AI JSON utilities |
