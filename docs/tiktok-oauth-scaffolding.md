# ROSTER — TikTok OAuth Scaffolding (Tier 2 deferred work)

**Status:** Design complete, build deferred until TikTok Developer app is approved.
**Blocker:** Thabiso needs to (1) create a business TikTok account and (2) submit the developer application using the copy in the earlier chat thread. Approval typically takes 1–2 weeks.
**Owner:** Thabiso (sole maintainer).

This doc is the full briefing to pick up the build cleanly when approval lands. Designed to be self-contained — paste this back into a future session and we can resume without re-deriving anything.

---

## 1. What "TikTok per-artist OAuth" actually delivers

When an artist on a ROSTER user's roster connects their TikTok account, the nightly fetcher gets:

- **Profile-level metrics** (from `/v2/user/info/`):
  - `followers` — `follower_count`
  - `total_likes` — `likes_count`
  - `total_video_count` — useful as a velocity baseline
- **Per-video metrics** (from `/v2/video/list/`):
  - `view_count`, `comment_count`, `share_count`, `like_count` per video
  - We aggregate the videos posted in the last 28 days into:
    - `video_views_28d` (sum)
    - `comments_28d` (sum, optional engagement signal)

### What the Display API does **NOT** give us

- **`sound_uses_28d`** — the big virality signal in our scoring engine. The Display API only exposes the artist's own videos, not aggregate sound-use counts across the platform. To get those we'd need the TikTok Research API which is far more gated (academic affiliation required + content provenance attestation). Until then `sound_uses_28d` stays as a manual-entry field.
- **Audience demographics** — country/age/gender breakdowns are S4A-tier (no public API).
- **Sound-level analytics** for a specific track — same Research API gate.
- **Engagement on other people's videos** that use the artist's sound.

This is an honest gap to flag to the user when shipping. The OAuth integration replaces about 60% of what they're typing in manually for TikTok; the rest stays manual.

---

## 2. Prerequisites (must be done before starting the build)

1. **TikTok Developer app approved** — credentials in hand:
   - `TIKTOK_CLIENT_KEY` (called "Client Key" in the dashboard)
   - `TIKTOK_CLIENT_SECRET`
   - Approved scopes (we requested `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list` — TikTok may approve a subset)
   - Approved redirect URIs:
     - dev: `http://127.0.0.1:3001/api/tiktok/callback`
     - prod: `https://rosterapp.ai/api/tiktok/callback`

2. **`.env.local` updated** with:
   ```
   TIKTOK_CLIENT_KEY=
   TIKTOK_CLIENT_SECRET=
   ```
   `NEXT_PUBLIC_APP_URL` is already set; the redirect URI is built from it.

---

## 3. Build steps (in order)

### Step 1 — DB migration (`020-artist-tiktok-tokens.sql`)

```sql
-- Per-artist TikTok OAuth tokens. Multiple artists can connect to
-- different TikTok accounts; each gets its own row keyed by artist_id.
create table public.artist_tiktok_tokens (
  artist_id uuid primary key references public.artists(id) on delete cascade,
  open_id text not null,                     -- TikTok per-app stable user ID
  union_id text,                             -- present when app is part of a developer's app group
  scope text not null,                       -- space-separated approved scopes
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,           -- access_token expiry
  refresh_expires_at timestamptz not null,   -- refresh_token expiry (~1 year)
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artist_tiktok_tokens_open_id_idx
  on public.artist_tiktok_tokens (open_id);

-- RLS: only the user who owns the artist can see their tokens.
alter table public.artist_tiktok_tokens enable row level security;

create policy "owner can read tokens"
  on public.artist_tiktok_tokens for select
  using (
    artist_id in (
      select id from public.artists where user_id = auth.uid()
    )
  );

create policy "owner can delete tokens"
  on public.artist_tiktok_tokens for delete
  using (
    artist_id in (
      select id from public.artists where user_id = auth.uid()
    )
  );

-- Inserts/updates only via service role (the OAuth callback runs
-- server-side with admin client).
```

Also add a column to `artists`:

```sql
alter table public.artists
  add column if not exists tiktok_open_id text;
```

This denormalised copy of the open_id lives on the artists row so the orchestrator's bulk artist load doesn't need to join the tokens table. The actual token still has to be looked up per-artist in the tokens table because they're different security tiers.

### Step 2 — `lib/tiktok/oauth.ts` (mirror of `lib/spotify/oauth.ts`)

Expose:

```ts
// State encoding: state = base64({ artistId, csrfNonce }). On callback
// we decode + verify the CSRF nonce against an httpOnly cookie. Same
// pattern as the existing Spotify OAuth.
export function buildAuthUrl(state: string): string;

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;          // seconds
  refresh_expires_in: number;  // seconds (~1 year)
  open_id: string;
  scope: string;
  token_type: "Bearer";
}

// Exchange an authorization code for tokens.
export async function exchangeCode(
  code: string
): Promise<TikTokTokenResponse>;

// Refresh an expiring access token.
export async function refreshAccessToken(
  refreshToken: string
): Promise<TikTokTokenResponse>;

// Revoke (called when artist disconnects).
export async function revokeAccessToken(accessToken: string): Promise<void>;

// Highest-level helper: given an artistId, return a valid access_token,
// refreshing if needed and persisting the new tokens. Throws
// "TIKTOK_NOT_CONNECTED" if no row in artist_tiktok_tokens.
export async function getAccessTokenForArtist(
  artistId: string
): Promise<string>;
```

**Endpoints:**
- Authorise: `https://www.tiktok.com/v2/auth/authorize/`
- Token: `https://open.tiktokapis.com/v2/oauth/token/`
- Revoke: `https://open.tiktokapis.com/v2/oauth/revoke/`

**Required scope string** (space-separated): `user.info.basic user.info.profile user.info.stats video.list`

### Step 3 — `app/api/tiktok/connect/route.ts` (initiates OAuth)

GET handler:
- Reads `?artistId=...` from query
- Verifies the current user owns the artist
- Generates CSRF nonce, stores in httpOnly cookie `roster_tiktok_state`
- Builds state = base64({ artistId, csrfNonce })
- Redirects to `buildAuthUrl(state)`

### Step 4 — `app/api/tiktok/callback/route.ts`

GET handler:
- Reads `code`, `state`, optional `error` from query
- If `error` is present: redirect to `/dashboard?tiktok=denied`
- Decode state, verify CSRF nonce matches cookie
- Verify the user still owns the artist named in state
- Exchange code via `exchangeCode(code)`
- Upsert into `artist_tiktok_tokens`:
  - `expires_at = now() + expires_in seconds`
  - `refresh_expires_at = now() + refresh_expires_in seconds`
- Update `artists.tiktok_open_id`
- Clear the cookie
- Redirect to `/dashboard?tiktok=connected&artistId=X` (toast on dashboard)

### Step 5 — `app/api/tiktok/disconnect/route.ts`

POST handler:
- Verify user owns artist
- Look up tokens, call `revokeAccessToken`
- Delete row from `artist_tiktok_tokens`
- Clear `artists.tiktok_open_id`
- Return `{ ok: true }`

### Step 6 — Linked Account panel for TikTok in Update Stats modal

Extend the existing `LinkedAccountPanel` (in `components/dashboard/artists-widget.tsx`) — add `"tiktok"` as a new HandleKind. Behaviour differs from Audiomack/YouTube because TikTok uses OAuth, not a manual handle field:

- **Not connected** state: shows "Not linked yet" + a single button labeled "Connect TikTok" that opens `/api/tiktok/connect?artistId=X` in a new window or full redirect.
- **Connected** state: shows "Connected as @username" + Disconnect button + Re-fetch button (same as YouTube/Audiomack).
- The HandleKind = "tiktok" branch should NOT show an Edit input — there's nothing to manually type.

Plumbing changes:
- `LiveArtist` interface gains `tiktokOpenId?: string | null` and `tiktokDisplayName?: string | null`
- `GET /api/artists` returns both fields (join `artist_tiktok_tokens` to get display name? Or store display name on `artists` row at connect time — simpler).

### Step 7 — `lib/fetchers/tiktok.ts`

```ts
import type { FetcherContext, FetcherResult } from "./types";
import { emptyResult } from "./types";
import { getAccessTokenForArtist } from "@/lib/tiktok/oauth";

const TT_BASE = "https://open.tiktokapis.com/v2";

export async function fetchTikTok(
  artistId: string,
  artistName: string,
  ctx: FetcherContext
): Promise<FetcherResult> {
  let token: string;
  try {
    token = await getAccessTokenForArtist(artistId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown TikTok auth error";
    if (msg === "TIKTOK_NOT_CONNECTED") {
      return emptyResult("tiktok_oauth", `TikTok not connected for '${artistName}'`);
    }
    return emptyResult("tiktok_oauth", `TikTok token error: ${msg}`);
  }

  // 1) Profile-level: followers, likes, video count
  // GET /v2/user/info/?fields=open_id,union_id,follower_count,
  //   following_count,likes_count,video_count,display_name
  // (the fields query param is required — TikTok rejects empty fields)

  // 2) Per-video stats — paginate /v2/video/list/?fields=...,view_count,
  //   comment_count,share_count,create_time,like_count
  // Walk pages until videos older than 28 days; sum view_count and
  // comment_count for the in-window videos.

  // Returns:
  //   metrics.followers
  //   metrics.video_views_28d   (sum of view_count for videos in window)
  //   metrics.comments_28d      (sum of comment_count, optional)
  //   internal._total_likes_lifetime  (for future delta math if useful)

  // Source: "tiktok_oauth"
}
```

**Important:** TikTok's `/v2/user/info/` requires a `fields` query parameter. Empty/missing fields = 400 error. Always specify explicitly.

**Pagination:** `video.list` returns 20 videos per page max; `cursor` field for pagination. Stop when `create_time` of the oldest returned video is older than 28 days ago — no need to walk the full back catalog.

### Step 8 — Wire into orchestrator (`lib/fetchers/index.ts`)

In the artists query, add `tiktok_open_id` to the SELECT.

In the per-artist fetcher loop, add a TikTok branch:

```ts
const fetcherPromises: Promise<{platform: Platform, result: FetcherResult}>[] = [
  fetchAudiomack(...).then(r => ({platform: "audiomack", result: r})),
  fetchYouTube(...).then(r => ({platform: "youtube", result: r})),
  fetchSpotify(...).then(r => ({platform: "spotify", result: r})),
];

if (artist.tiktok_open_id) {
  fetcherPromises.push(
    fetchTikTok(artist.id, artist.name, tiktokCtx)
      .then(r => ({platform: "tiktok", result: r}))
  );
}
```

(Skip the call entirely when no token — saves a useless DB lookup that's just going to return TIKTOK_NOT_CONNECTED.)

### Step 9 — Per-artist refetch endpoint already works

`/api/artists/[id]/refetch` calls `runFetchers({ artistIds: [id] })` which runs the full orchestrator including the new TikTok fetcher. No change needed.

### Step 10 — Smoke test

1. Manually connect one artist (your own TikTok account is fine for testing — connect it to De Mthuda's row temporarily, then disconnect after).
2. Click Re-fetch. Verify response shows TikTok metrics written.
3. Open Spotify tab → confirm TikTok-tab Linked panel now shows "Connected as @yourusername".
4. Wait for token expiry (or manually expire `expires_at` in DB) and re-fetch — confirm refresh flow runs.
5. Click Disconnect — confirm row deleted from `artist_tiktok_tokens` and `tiktok_open_id` cleared.

---

## 4. Edge cases to handle

| Case | Behavior |
|---|---|
| User revokes app inside TikTok app settings | API calls return 401. Catch in `getAccessTokenForArtist`, mark token as broken (or just delete + surface in UI: "TikTok connection expired — reconnect"). |
| Refresh token expired (>1 year unused) | Refresh call returns specific error. Same UX as revoked: prompt reconnect. |
| Rate limit hit (429) | Backoff + retry once. If still 429, return soft failure for that night's run; will catch up next night. |
| Artist deletes their TikTok account | API returns 404 on `/v2/user/info/`. Surface "TikTok account not found" in UI; let user disconnect. |
| Display name changed | Update on next successful refetch — store on artists row at connect time, refresh on every fetch. |
| User connects same TikTok account to two different artists | Allowed — each artist row has its own tokens. open_id collision is fine (TikTok scopes are per-app, not per-artist). |
| TikTok app under review / restricted scopes | Some scopes might be approved with delays. The fetcher should gracefully skip metrics whose scope wasn't granted (read `scope` field on the token). |

---

## 5. Files that will be created or modified

**New files:**
- `supabase-migrations/020-artist-tiktok-tokens.sql`
- `lib/tiktok/oauth.ts`
- `lib/fetchers/tiktok.ts`
- `app/api/tiktok/connect/route.ts`
- `app/api/tiktok/callback/route.ts`
- `app/api/tiktok/disconnect/route.ts`

**Modified files:**
- `.env.example` — add `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` placeholders
- `lib/fetchers/index.ts` — query `tiktok_open_id`, run `fetchTikTok` conditionally
- `lib/scoring/types.ts` — already has `tiktok_oauth` MetricSource (no change)
- `app/api/artists/route.ts` — add `tiktokOpenId`, `tiktokDisplayName` to GET response
- `components/dashboard/artists-widget.tsx`:
  - Add `tiktokOpenId` + `tiktokDisplayName` to LiveArtist interface
  - Extend HandleKind to include `"tiktok"`
  - Add tiktok branch to `HANDLE_META` and `LinkedAccountPanel` rendering condition
  - Render TikTok Linked Account panel on the TikTok tab

**No changes needed in:**
- `lib/scoring/index.ts` (engine reads metrics, doesn't care about source)
- `lib/scoring/config.ts` (TikTok already in REACH_WEIGHTS)
- `lib/scoring/platforms.ts` (TikTok metrics already registered)
- Cron route — orchestrator change is invisible to the cron entry

---

## 6. Estimated build time once approval lands

- DB migration: 15 min (writing + running)
- OAuth helpers (`lib/tiktok/oauth.ts`): 1.5 hr (mirror Spotify OAuth pattern)
- Connect/callback/disconnect routes: 1 hr
- Fetcher (`lib/fetchers/tiktok.ts`): 1 hr (Display API is well-documented)
- LinkedAccountPanel TikTok branch: 30 min
- Orchestrator wiring: 15 min
- Smoke testing + bug fixes: 1 hr

**Total: ~5 hours of focused build time.** Best done in a single sitting so the OAuth + token refresh edge cases stay fresh in head.

---

## 7. What to paste back when resuming

Just send me this entire doc + a one-line update on TikTok app status:

> "TikTok dev app approved. Credentials in .env.local. Resume scaffolding."

That's enough context to pick up cleanly.

If TikTok rejects the app or restricts scopes, paste the rejection email and we'll either (a) re-apply with adjusted scope justifications or (b) ship a reduced-scope version that uses only the approved subset.

---

## 8. Reference: TikTok Developer URLs

- Developer portal: https://developers.tiktok.com/
- App management: https://developers.tiktok.com/apps
- OAuth docs: https://developers.tiktok.com/doc/login-kit-web
- Display API docs: https://developers.tiktok.com/doc/display-api-overview
- Sandbox / test users: configured per-app in the developer dashboard under "Sandbox"
