# Pilot C Drop — GigsterGarage v1.0

**Repo:** `GigsterGarage`  
**Apply mode:** manual apply (no auto-apply)  
**Scope:** client-side only; **no schema changes**  
**Generated:** 2025-01-28

---

## What this fixes

### 1) Gates protected polling/queries

All high-frequency polling queries are now `enabled` only when:
- `authReady === true` AND
- `isAuthenticated === true`

This stops the **repeated 401 loops** when logged out.

### 2) Detects auth expiry quickly

When any request returns **401/403**, we invalidate `/api/auth/user` so `useAuth()` updates and gating shuts off polling quickly (instead of continuing to hammer).

### 3) useAuth becomes "401-safe"

`/api/auth/user` now returns `null` on 401 instead of throwing, and we add:
- `authReady`
- a light `refetchInterval` to detect expiry

---

## FILES TO PATCH (6 total)

### FILE 1: `client/src/hooks/useAuth.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const { data, isLoading, isFetching, error } = useQuery<AuthResponse | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });

      // Key behavior: treat 401 as "not authenticated" (not an error)
      if (res.status === 401) return null;

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`Auth check failed (${res.status}): ${text}`);
      }

      return (await res.json()) as AuthResponse;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Keep this light but present: helps detect expired sessions and stop polling
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const user = data?.user;

  // "authReady" is true when we've finished initial auth determination
  const authReady = !isLoading && !isFetching;

  return {
    user,
    authReady,
    isLoading,
    isFetching,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isDemoUser: !!user?.isDemo,
    demoSessionId: user?.demoSessionId,
    sessionExpiresAt: user?.sessionExpiresAt,
    error,
  };
}
```

---

### FILE 2: `client/src/lib/queryClient.ts`

Adds auth invalidation on 401/403 from **both** `apiRequest()` and `getQueryFn()`.

```ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Simple URL resolution - uses relative paths for same-origin requests
const resolveUrl = (path: string): string => {
  if (!path) throw new Error("apiRequest: empty path");
  // If already absolute URL, use as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Otherwise use relative path (Vite serves backend on same port)
  return path;
};

// Safe JSON stringify (handles BigInt by stringifying it)
const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch (e: any) {
    throw new Error(`apiRequest: JSON serialization failed: ${e?.message || String(e)}`);
  }
};

// Best-effort: if we see 401/403 anywhere, force re-check of /api/auth/user
function invalidateAuthUserQuery() {
  try {
    const qc = (globalThis as any).__GG_QUERY_CLIENT__;
    if (qc?.invalidateQueries) {
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  } catch {
    // ignore
  }
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest<T = unknown>(
  method: ApiMethod,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const url = resolveUrl(path);
  const hasBody = body !== undefined && method !== "GET";
  const serialized = hasBody ? safeStringify(body) : undefined;

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    body: serialized,
    ...init,
  });

  // If auth expired, force /api/auth/user to re-check so polling can stop via gating
  if (res.status === 401 || res.status === 403) {
    invalidateAuthUserQuery();
  }

  const contentType = res.headers.get("content-type") || "";
  let parsed: any = null;
  try {
    parsed = contentType.includes("application/json") ? await res.json() : await res.text();
  } catch {
    // Ignore parse error; keep parsed=null so we can surface status text
  }

  if (!res.ok) {
    const serverMsg =
      (parsed && typeof parsed === "object" && (parsed.error?.message || parsed.message)) ||
      (typeof parsed === "string" ? parsed : res.statusText);

    throw new Error(`HTTP ${res.status} ${res.statusText}: ${serverMsg || "Request failed"}`);
  }

  return parsed as T;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      invalidateAuthUserQuery();
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Expose queryClient for best-effort auth invalidation without circular TS ordering issues
(globalThis as any).__GG_QUERY_CLIENT__ = queryClient;
```

---

### FILE 3: `client/src/components/timer-widget.tsx`

Gate: **active timer**, **projects**, **tasks**.

Key changes:
```ts
import { useAuth } from "@/hooks/useAuth";

// Inside component:
const { authReady, isAuthenticated } = useAuth();
const authed = authReady && isAuthenticated;

// Gate all queries:
const { data: activeTimer } = useQuery<TimeLog | null>({
  queryKey: ["/api/timelogs/active"],
  enabled: authed,  // <-- ADD THIS
  refetchInterval: (data) => (data ? 5000 : 30000),
  staleTime: 1000 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

const { data: projects = [] } = useQuery<Project[]>({
  queryKey: ["/api/projects"],
  enabled: authed,  // <-- ADD THIS
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
});

const { data: tasks = [] } = useQuery<Task[]>({
  queryKey: ["/api/tasks"],
  enabled: authed,  // <-- ADD THIS
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
});
```

---

### FILE 4: `client/src/pages/productivity.tsx`

Gate all polling queries behind auth.

Key changes:
```ts
import { useAuth } from "@/hooks/useAuth";

// Inside component:
const { authReady, isAuthenticated } = useAuth();
const authed = authReady && isAuthenticated;

// Gate all queries:
const { data: timeLogs = [] } = useQuery<TimeLog[]>({
  queryKey: ["/api/timelogs"],
  enabled: authed,  // <-- ADD THIS
  staleTime: 1000 * 60 * 2,
  refetchInterval: 1000 * 30,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

const { data: stats7Days } = useQuery<ProductivityStats>({
  queryKey: ["/api/productivity/stats", { days: 7 }],
  enabled: authed,  // <-- ADD THIS
  staleTime: 1000 * 60 * 5,
  refetchInterval: 1000 * 60,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

const { data: stats30Days } = useQuery<ProductivityStats>({
  queryKey: ["/api/productivity/stats", { days: 30 }],
  enabled: authed,  // <-- ADD THIS
  staleTime: 1000 * 60 * 5,
  refetchInterval: 1000 * 60,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
```

---

### FILE 5: `client/src/pages/mobile-time-tracking.tsx`

Gate `/api/timelogs` query behind auth.

Key changes:
```ts
import { useAuth } from "@/hooks/useAuth";

// Inside component:
const { authReady, isAuthenticated } = useAuth();
const authed = authReady && isAuthenticated;

const { data: timeLogs = [], isLoading } = useQuery<TimeLog[]>({
  queryKey: ["/api/timelogs"],
  enabled: authed,  // <-- ADD THIS
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
```

---

### FILE 6: `client/src/components/app-header.tsx`

Gate `tasks` and `active timer` polling behind auth.

Key changes:
```ts
import { useAuth } from "@/hooks/useAuth";

// Inside component:
const { user, isAdmin, authReady, isAuthenticated } = useAuth();
const authed = authReady && isAuthenticated;

const { data: tasks = [] } = useQuery<Task[]>({
  queryKey: ["/api/tasks"],
  enabled: authed,  // <-- ADD THIS
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

const { data: activeTimer } = useQuery<TimeLog | null>({
  queryKey: ["/api/timelogs/active"],
  enabled: authed,  // <-- ADD THIS
  refetchInterval: 5000,
  staleTime: 1000 * 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
```

---

## Definition of Done checklist (Pilot C)

- [ ] When **logged out**, the browser Network tab shows **no repeating 401s** from:
  - `/api/timelogs/active`
  - `/api/timelogs`
  - `/api/productivity/stats`
  - `/api/tasks`
- [ ] When **auth expires mid-session**, you see at most **one** 401 burst, then polling stops (auth invalidation kicks in).
- [ ] When **logged in**, timer + productivity pages still poll normally.
- [ ] No schema/DB changes were introduced.

---

## One-liner test script (optional)

Open GigsterGarage app → DevTools → Network:

1. Log out
2. Visit `/productivity`
3. Wait 60 seconds

✅ You should **not** see a steady stream of `/api/timelogs` / `/api/productivity/stats` 401s anymore.

---

## Notes

- `QuickActionButton.tsx` was analyzed but did not require changes (no polling queries detected)
- All changes are client-side only
- This patch is for **manual apply** to GigsterGarage repo
