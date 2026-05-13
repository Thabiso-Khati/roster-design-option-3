# ROSTER — Engineering Standards

This file is the canonical source of engineering rules for ROSTER.
It is read by AI coding assistants and serves as the team contract.

---

## Testing — the rule

> **Every new `lib/` function and `app/api/` route handler ships with
> a corresponding test in `__tests__/`.**

This is a definition-of-done requirement, not a nice-to-have.
If it is not tested it is not finished.

### What must be tested

| Produced | Test required |
|----------|---------------|
| Pure library function (`lib/**`) | Unit test — all branches |
| API route handler (`app/api/**`) | Unit test — happy path + error paths |
| Background queue consumer | Unit test — each job type + failure → 500 |
| Middleware / guards | Unit test — allow path + block path |
| Bug fix | Regression test that reproduces the bug |

### What does NOT need a test right now

- UI components (Storybook is sufficient)
- One-off migrations
- `app/api/cron/` — covered by smoke tests

### Running tests

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

Coverage thresholds live in `vitest.config.ts`. They start at 20 % and
must only be raised, never lowered, without a comment explaining why.

### Test file naming

```
__tests__/<feature-area>-<what>.test.ts

Examples:
  __tests__/queue-transact-publisher.test.ts
  __tests__/bookings-pagination.test.ts
  __tests__/vault-crypto.test.ts
```

### Mocking rules

- Always mock `@/lib/supabase/admin`, `@/lib/supabase/server`, and
  `@/lib/logger` at the top of every test file.
- Mock third-party SDKs (`@upstash/qstash`, `resend`, etc.) — never
  make real network calls in unit tests.
- Use `vi.stubEnv(key, value)` + `vi.unstubAllEnvs()` in `afterEach`
  to control `process.env` per-test. **Never** mutate `process.env`
  directly (the value won't be restored after the test).
- Env vars in `lib/` modules must be read **inside functions** (not at
  module load time) so that `vi.stubEnv` works without module resets.

---

## CRITICAL: No middleware.ts

This project uses Next.js 16.x (Turbopack) which requires `proxy.ts` at the root.
`middleware.ts` must not exist -- Vercel fails the build if both are present.

- NEVER create or edit middleware.ts
- All middleware logic (auth, rate limiting, CSP) lives in proxy.ts
- The exported function is named proxy, not middleware
- If middleware.ts ever appears: delete it and merge its logic into proxy.ts

---

## CRITICAL: CSP style-src must include the per-request nonce

React 19 (Next.js 15+) automatically propagates the `nonce` prop from any
`<script nonce={nonce}>` element to ALL `<link rel="stylesheet">` tags the
framework renders. Safari and nonce-aware Chrome then require the matching
`'nonce-xxx'` to be present in `style-src` — otherwise the stylesheet is
blocked even when `'self'` and `'unsafe-inline'` are present.

- `style-src` in `buildCsp()` must always include `'nonce-${nonce}'`
- `'unsafe-inline'` is kept as a fallback for non-nonce-aware browsers and
  third-party tools (PostHog, Sentry) that inject `<style>` elements
- Never add dynamic `<style>` injection via `useEffect` — put keyframes /
  component CSS in `app/globals.css` so they live in the nonce-covered sheet
- Symptom of regression: local dev CSS completely absent in Safari/Chrome

---

## Pagination

Every `GET` list endpoint that returns an array uses offset pagination.

**Standard pattern:**

```typescript
const PAGE_SIZE     = 20;   // sensible default for the resource
const MAX_PAGE_SIZE = 100;  // hard cap — increase only with justification

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0", 10));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;

  const { data, error, count } = await supabase
    .from("table")
    .select("*", { count: "exact" })
    .range(from, to);

  return NextResponse.json({
    items:   data ?? [],
    total:   count ?? 0,
    page,
    limit,
    hasMore: from + (data?.length ?? 0) < (count ?? 0),
  });
}
```

- `page` is 0-based.
- Always include `{ count: "exact" }` on the `.select()`.
- Return the full envelope (`total`, `page`, `limit`, `hasMore`) even if
  the result fits on one page — callers use `hasMore` to know when to stop.
- Never return unbounded arrays from an API route.

---

## Transactional messages

Single-recipient sends (welcome message, claim email, booking reminder)
go through the QStash retry queue via `enqueueTransact()`.

```typescript
import { enqueueTransact } from "@/lib/queue/transact";

const { queued, error } = await enqueueTransact({ type: "email", to, subject, html });

if (!queued) {
  if (error) logger.warn("[route] QStash enqueue failed — falling back", {}, error);
  // Fallback: send inline
  await sendEmail({ to, subject, html });
}
```

**Rules:**
- Always implement the inline fallback. If QStash is not configured
  (no `QSTASH_TOKEN`) the code must still work.
- Do **not** use `enqueueTransact` for bulk campaign sends — those go
  through `lib/campaigns/dispatch.ts` which manages its own per-recipient
  status tracking.
- The consumer route `/api/queue/transact` is excluded from the rate
  limiter (see `SKIP` in `proxy.ts`). Keep it there.
- Return HTTP 500 from the consumer on send failure — that is what
  signals QStash to retry. A 400 means "bad payload, don't retry".

---

## Security defaults

### Fail-secure
Context/auth values must default to **deny** while loading, not allow.

```typescript
// ✅ Correct
const defaultValue = { loading: true, can: () => false };

// ❌ Wrong — grants permissions before auth confirms
const defaultValue = { loading: true, can: () => true };
```

### Rate limiting
All `/api/` routes go through the sliding-window rate limiter in
`middleware.ts` except routes in the `SKIP` list. When adding a new
exempt route (cron, webhook, queue consumer), add it to `RL_SKIP` with a
comment explaining why.

### Row-level security
Every Supabase table has RLS enabled. Admin operations use
`createAdminClient()` (service role) only where RLS would block
legitimate server-side work. Document why with a comment.

---

## Code style

- TypeScript strict mode is on. No `any` without a `// eslint-disable` comment explaining the exception.
- `async/await` throughout — no `.then()` chains.
- No `console.log` — use `logger.info / warn / error` from `@/lib/logger`.
- Imports: external packages first, then `@/` aliases, then relative paths.
- One exported function per concern per file where practical.
- No magic numbers — extract to named constants at the top of the file.

- When passing props to custom components, check the type signature first. Never pass `style` unless the component explicitly accepts it.