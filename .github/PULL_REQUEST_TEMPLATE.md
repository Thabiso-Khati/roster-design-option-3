## What does this PR do?

<!-- One sentence. Be specific. "Fix X in Y" not "Various improvements." -->

## Why?

<!-- What problem does it solve? Link a ticket or describe the user impact. -->

---

## Security checklist

> A PR that fails any of these checks will not be merged.

- [ ] **No secrets in code** — no API keys, tokens, passwords, or real credentials anywhere in the diff (including tests and comments)
- [ ] **Identity from session** — user identity comes from `supabase.auth.getUser()` on the server, never from request body or query params
- [ ] **Admin guards fail closed** — when the relevant env var is empty or unset, access is denied — not granted
- [ ] **External calls before DB writes** — in multi-step flows, the external API is called first; the DB record is only written after success
- [ ] **Webhooks return 5xx on DB failure** — never return `200` when a database write fails
- [ ] **Email domain** — all email addresses use `@rosterapp.ai`, never `@rosterapp.ai`

---

## Test checklist

- [ ] `npm test` passes locally (green before and after this PR)
- [ ] New code has test coverage for at least one unhappy path
- [ ] No dead code or placeholder comments left in the diff (e.g. `// TODO: fetch real email`)

---

## How to test this manually

<!-- Steps a reviewer can follow to verify the change works. -->

1.
2.
3.

## Screenshots (if UI change)

<!-- Before / after, or delete this section. -->
