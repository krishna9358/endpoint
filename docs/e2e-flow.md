# Endpoint – End-to-End Request Flow

This document traces the complete lifecycle of a REST request: from the user typing in the UI, through saving to PostgreSQL, executing via Axios, and rendering the response.

---

## 1. Application Bootstrap

```
Browser loads /(workspace)/page.tsx
  └── useWorkspaceStore → selectedWorkspace (Zustand)
  └── useGettingWorkspaceById(selectedWorkspace.id) [React Query]
        └── getWorkspaceById() [Server Action] → db.workspace.findUnique()
  └── ResizablePanelGroup
        ├── Left  → <RequestPlayground />
        └── Right → <TabbedSidebar currentWorkspace={...} />
```

TabbedSidebar immediately fires `useGetCollections(workspaceId)` → `getCollections()` → `db.collection.findMany()`. Each collection renders a `<CollectionFolder>` which lazy-loads its requests when expanded via `useGetRequests(collectionId)`.

---

## 2. Opening / Creating a Tab

### User opens a saved request from the sidebar

```
User clicks a request in CollectionFolder
  └── openRequestTab(request) [Zustand action]
        ├── Check: is there already a tab with tab.requestId === request.id?
        │     YES → setActiveTabId to that tab
        │     NO  → create new RequestTab {
        │               id: nanoid(),        ← local tab ID (not the DB id)
        │               requestId: request.id,
        │               collectionId: request.collectionId,
        │               method, url, body, headers, parameters,
        │               unsavedChanges: false
        │           }
        └── setActiveTabId(newTab.id)
```

### User creates a blank tab

```
User presses Cmd+Shift+G  (or clicks + button)
  └── addTab() [Zustand action]
        └── new RequestTab {
              id: nanoid(),
              title: "Untitled",
              method: "GET",
              url: "https://...",    ← default placeholder
              unsavedChanges: true,
              requestId: undefined   ← not yet in DB
            }
```

---

## 3. Editing a Request

Every user interaction in the editor updates the **Zustand tab state only** — no DB write happens yet.

```
RequestEditor
  └── RequestBar
  │     ├── <Select> method change → updateTab(tabId, { method })
  │     └── <Input>  URL change    → updateTab(tabId, { url })
  └── RequestEditorArea  (tabs: Parameters | Headers | Body)
        ├── Parameters tab → KeyValueFormEditor
        │     └── onChange → handleParametersChange()
        │           └── filter enabled items
        │           └── JSON.stringify([{key, value, enabled}, ...])
        │           └── updateTab(tabId, { parameters: "<json string>" })
        ├── Headers tab → KeyValueFormEditor
        │     └── same pattern → updateTab(tabId, { headers: "<json string>" })
        └── Body tab → BodyEditor (Monaco Editor)
              └── handleBodyChange()
              └── updateTab(tabId, { body: "<raw string>" })
```

### Serialization format stored in tab state

Headers and parameters are stored as **JSON strings** representing an array:

```json
"[{\"key\":\"Authorization\",\"value\":\"Bearer xyz\",\"enabled\":true}]"
```

Body is stored as a **raw string** (the literal text in the editor — could be JSON, plain text, etc.).

---

## 4. Saving a Request to the Database

### 4a. First save (new request, no collectionId yet)

```
User presses Cmd+S
  └── requestPlayground checks: activeTab.collectionId === undefined
        └── setShowSaveModel(true)
              └── <SaveRequestToCollectionModal> opens
                    └── User selects collection, confirms
                          └── useAddRequestToCollection(collectionId).mutate(requestData)
                                └── addRequestToCollection(collectionId, value) [Server Action]
                                      └── db.request.create({
                                            name, url, method, collectionId,
                                            parameters,   ← JSON string from tab
                                            headers,      ← JSON string from tab
                                            body,         ← raw string from tab
                                            response: undefined
                                          })
                                          returns: Request (with DB-assigned cuid id)
                    onSuccess:
                      └── queryClient.invalidateQueries(["requests"])   ← refreshes sidebar
                      └── updateTabFromSavedRequest(activeTabId, data)
                            └── replaces tab.id with data.id (DB cuid)
                            └── sets unsavedChanges: false
                            └── setActiveTabId(data.id)
```

### 4b. Subsequent saves (request already in DB)

```
User presses Cmd+S
  └── activeTab.collectionId is defined → skip modal
        └── useSaveRequest(activeTab.requestId).mutateAsync({
              name, url, method, body, headers, parameters
            })
              └── saveRequest(id, value) [Server Action]
                    └── db.request.update({
                          where: { id },
                          data: { name, url, method, parameters, headers, body }
                        })
              onSuccess:
                └── queryClient.invalidateQueries(["requests"])
                └── updateTabFromSavedRequest(activeTabId, data)
                      └── unsavedChanges: false
```

---

## 5. Sending a Request (The Execute Path)

This is the core flow. Everything runs server-side inside the `run()` Server Action.

```
User clicks "Send" button (RequestBar)
  └── onSendRequest()
        └── useRunRequest(tab.requestId).mutateAsync()
              └── run(requestId) [Server Action]
```

### 5a. `run()` – Step by step

```typescript
// Step 1: Fetch request from DB
const request = await db.request.findUnique({ where: { id: requestId } })
// → { method, url, headers (string), body (string), parameters (string), ... }

// Step 2: Build config
// NOTE: headers/parameters are stored as JSON key-value arrays but cast directly
// to Record<string,string> here — this is the current implementation
const requestConfig = {
  method:     request.method,               // "GET" | "POST" | ...
  url:        request.url,
  headers:    request.headers as unknown as Record<string, string> || undefined,
  body:       request.body    || undefined,
  parameters: request.parameters as unknown as Record<string, string> || undefined,
}

// Step 3: Execute HTTP request
const response = await sendRequest(requestConfig)
```

### 5b. `sendRequest()` – Axios execution

```typescript
const config: AxiosRequestConfig = {
  method:         req.method,
  url:            req.url,
  headers:        req.headers,       // passed straight to Axios
  data:           req.body,          // request body
  params:         req.parameters,    // appended to URL as query string
  validateStatus: (s) => s >= 200 && s < 300,  // only 2xx = success
}

const start = performance.now()
const res = await axios(config)
const end   = performance.now()

// Calculate response size
// Prefer Content-Length header; fall back to UTF-8 encoded byte count
const size = res.headers["content-length"]
  ? parseInt(res.headers["content-length"])
  : new TextEncoder().encode(JSON.stringify(res.data)).length

return {
  status:     res.status,
  statusText: res.statusText,
  headers:    Object.fromEntries(Object.entries(res.headers)),  // normalize to plain object
  data:       res.data,
  durationMs: end - start,
  size,
}
```

On Axios error (4xx/5xx or network failure):

```typescript
return {
  error:     error.message,
  durationMs: Math.round(end - start),
  size:       0,
}
```

### 5c. Back in `run()` – Persist the result

```typescript
const failed = "error" in response

// Build the DB payload
const runData = {
  status:     failed ? 0          : response.status,
  statusText: failed ? error.msg  : response.statusText,
  headers:    failed ? DbNull     : response.headers,   // Json column
  body:       failed ? {error}    : response.data,      // Json column
  durationMs: Math.round(response.durationMs),
}

// Upsert RequestRun — only ONE run record per request (latest wins)
await db.requestRun.upsert({
  where:  { requestId },
  create: { requestId, ...runData },
  update: runData,
})

// Also update request.response (String field) with latest data
if (!failed && response.data != null) {
  await db.request.update({
    where: { id: requestId },
    data:  { response: typeof data === "string" ? data : JSON.stringify(data) },
  })
}

return { success: !failed, requestRun, response }
```

---

## 6. Displaying the Response (Frontend)

```
run() returns { success, requestRun, response }
  └── useRunRequest.onSuccess(data)
        └── setResponseViewerData(data)   [Zustand]
        └── queryClient.invalidateQueries(["requests"])
        └── toast.success(...)

RequestEditor re-renders (reads responseViewerData from Zustand)
  └── responseViewerData !== null
        └── <ResponseViewer responseData={responseViewerData} />
```

### ResponseViewer rendering logic

```
ResponseViewer receives: { success, requestRun, result? }

Status bar:
  status     = result?.status     ?? requestRun.status
  statusText = result?.statusText ?? requestRun.statusText
  duration   = result?.duration   ?? requestRun.durationMs
  size       = result?.size       (from the sendRequest result)

  Color coding:
    2xx → green   3xx → yellow   4xx → orange   5xx → red

Body parsing:
  rawBody = requestRun.body
  if (typeof rawBody === "string") → JSON.parse(rawBody)
  else                             → rawBody  (already object)
  formattedJsonString = JSON.stringify(parsed, null, 2)

Tabs:
  JSON    → Monaco Editor (read-only, language: json, theme: vs-dark)
  Raw     → Monaco Editor (read-only, language: text)
  Headers → key/value list from requestRun.headers (Record<string, string>)
  Tests   → static UI placeholder (not yet implemented)
```

---

## 7. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
│                                                                 │
│  User types URL / method / headers / body                       │
│       │                                                         │
│       ▼                                                         │
│  Zustand Store (useRequestPlaygroundStore)                      │
│  ┌─────────────────────────────────────────────┐               │
│  │  tabs[]: { id, requestId, url, method,       │               │
│  │            headers (json str), body (str),   │               │
│  │            parameters (json str),            │               │
│  │            unsavedChanges }                  │               │
│  └─────────────────────────────────────────────┘               │
│       │ Cmd+S                    │ Click Send                   │
│       ▼                          ▼                              │
│  TanStack Mutation           TanStack Mutation                  │
│  useSaveRequest()            useRunRequest()                    │
└────────┬─────────────────────────┬──────────────────────────────┘
         │ Server Action            │ Server Action
         ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Node.js)                     │
│                                                                 │
│  saveRequest(id, value)          run(requestId)                 │
│       │                               │                         │
│       │                         1. db.request.findUnique()      │
│       │                         2. Build AxiosRequestConfig     │
│       │                         3. sendRequest() → axios()      │
│       │                               │                         │
│       │                         ┌─────▼──────────────────┐     │
│       │                         │  External API / Server  │     │
│       │                         └─────┬──────────────────┘     │
│       │                               │ HTTP response           │
│       │                         4. db.requestRun.upsert()       │
│       │                         5. db.request.update(response)  │
│       ▼                               ▼                         │
│  db.request.update()          return { success, requestRun }   │
└────────┬──────────────────────────────┬──────────────────────────┘
         │ Prisma                        │ Prisma
         ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL                               │
│                                                                 │
│  Request table                   RequestRun table               │
│  ─────────────                   ───────────────                │
│  id, name, method, url           id, requestId (unique)         │
│  headers  (String / json-str)    status, statusText             │
│  params   (String / json-str)    headers (Json)                 │
│  body     (String)               body    (Json)                 │
│  response (String, last result)  durationMs                     │
└─────────────────────────────────────────────────────────────────┘
         │ onSuccess                      │ onSuccess
         ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                 │
│                                                                 │
│  invalidateQueries(["requests"])   setResponseViewerData(data)  │
│       │                                  │                      │
│       ▼                                  ▼                      │
│  Sidebar refreshes              ResponseViewer renders          │
│  (collection request list)      status / duration / size        │
│                                 JSON body (Monaco)              │
│                                 response headers table          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Headers Serialization — Full Round-Trip

Understanding exactly how headers move through the system is important because two different formats are used at different layers.

### In the editor (UI → Zustand)

`KeyValueFormEditor` produces:
```typescript
[{ key: "Authorization", value: "Bearer token", enabled: true }, ...]
```

`handleHeadersChange` filters disabled rows then stores:
```typescript
updateTab(tabId, { headers: JSON.stringify(filteredArray) })
// headers field in Zustand = '[ {"key":"Authorization","value":"Bearer token","enabled":true} ]'
```

### Saved to DB (Zustand → Prisma)

```typescript
db.request.update({ data: { headers: tab.headers } })
// DB stores the JSON string as-is in the String? column
```

### Read from DB for execution (Prisma → axios)

```typescript
// In run():
headers: (request.headers as unknown as Record<string, string>) || undefined
```

> **Note:** `request.headers` at this point is the raw JSON string `'[{...}]'`. The cast to `Record<string, string>` does not actually parse it — Axios receives a string, not a headers object. This means headers are currently **not applied** to outgoing requests. The correct fix would be:
> ```typescript
> const parsedHeaders = request.headers ? JSON.parse(request.headers) : []
> const headersRecord = Object.fromEntries(
>   parsedHeaders.filter((h: any) => h.enabled).map((h: any) => [h.key, h.value])
> )
> ```

### Response headers (axios → DB → UI)

```typescript
// sendRequest() normalizes axios response headers to a plain object
headers: Object.fromEntries(Object.entries(res.headers))
// { "content-type": "application/json", "x-request-id": "...", ... }

// run() stores this as a native Json column
db.requestRun.upsert({ data: { headers: response.headers } })

// ResponseViewer reads it back as Record<string, string>
Object.entries(responseData.requestRun.headers ?? {}).map(([key, value]) => ...)
```

---

## 9. Error Handling Matrix

| Failure point | Behavior |
|---|---|
| `run()` – request not found in DB | throws `"Request ID not found"`, caught by outer try/catch |
| `sendRequest()` – network error / timeout | axios throws, caught → returns `{ error, durationMs, size: 0 }` |
| `sendRequest()` – 4xx/5xx | `validateStatus` rejects → axios throws → same error path |
| `run()` – DB upsert fails | inner catch writes a zero-status failed run; if that also fails, returns `{ success: false, error }` |
| `useSaveRequest` / `useAddRequestToCollection` | `onError` → `toast.error(error.message)` |
| `useRunRequest` | `onError` → `toast.error("Failed to send request.")` |
