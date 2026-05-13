# ROSTER — Regional Reach Weighting

**Status:** South Africa + Nigeria shipped (2026-04-26). 13 of 15 priority countries remaining.
**Owner:** Thabiso (sole maintainer)
**Refresh cadence:** Annual — re-run after IFPI Global Music Report and Spotify Loud&Clear publish.

---

## 1. Why this exists

ROSTER's Reach score weights each platform's signal by how meaningful that platform is for an artist's audience. Before this work, every artist used a single global weight set (Spotify 0.25, YouTube 0.20, Boomplay 0.15, etc.) — an Africa-friendly compromise but not country-accurate.

The problem with one global weight set:

- A **Nigerian** artist with massive Audiomack numbers got penalised, because Audiomack was only worth 10% of Reach while Spotify (small in Nigeria) was 25%. Their actual market dominance was buried.
- A **South African** artist riding a TikTok amapiano breakthrough was under-credited because TikTok was only 10% of Reach.
- Any **non-African** artist (US, UK) was unfairly counted against the Audiomack/Boomplay/Mdundo zeros they have because those platforms don't operate in their markets.

The fix: tell the engine "if this artist is from country X, use country X's weight profile instead." Each profile must sum to 1.0 and every weight is sourced + dated in inline comments so the engine stays auditable.

---

## 2. Methodology (apply this same workflow to remaining countries)

For each country, the workflow is:

### Step 1 — Research (free public sources only)

Sources used (in priority order — start at the top, exhaust each before moving down):

1. **Spotify Loud&Clear** (annual, free) — country-level royalty payouts, growth rate, listener counts. Gives the cleanest "Spotify weight" signal.
2. **DataReportal Digital `<year>`: `<country>`** (free, annual, ~Jan release) — TikTok / Instagram / Facebook / YouTube user counts and penetration percentages.
3. **IFPI Global Music Report executive summary** (free) — regional revenue totals, country-share within region.
4. **Audiomack press releases / Music Ally / The Condia coverage** — Audiomack MAU per country (Nigeria has named 15.3M figure; other countries usually only get qualitative "top-5 app" framing).
5. **Boomplay press releases / Quartz / TechCabal coverage** — Boomplay reach, partnerships (Transsion pre-install matters), royalty disputes.
6. **Mdundo investor announcements / LinkedIn** — Mdundo MAU per country (Kenya = 2.8M, Tanzania = 2.4M, Nigeria = 4.9M as of June 2022 disclosure).
7. **GSMA Mobile Economy Sub-Saharan Africa** (free PDF) — smartphone penetration, internet user counts.
8. **Sensor Tower Q1 reports** (free blog) — top-5 music app rankings per country, weekly active users per app.
9. **Local industry bodies** — RiSA (SA), MCSN (NG), GHAMRO (Ghana). Mostly useful for confirming general dominance order.
10. **Music In Africa / Techpoint Africa / TechCabal** — qualitative ground-truth on platform shifts.

### What's paywalled (skip — but flag in the country's notes):
- **Full IFPI tables** (~$2k for the per-country breakdown)
- **MIDiA Research detailed subscriber market shares** (subscription only)
- **Music Ally Insight Reports**
- **Chartmetric Pro country market share exports**

The free sources are enough to build defensible profiles. Paywalled data would tighten the percentages by maybe ±2 pp per platform.

### Step 2 — Synthesize weights

Build a table that sums to **exactly 1.0** across all 8 platforms in `lib/scoring/platforms.ts`:

```
spotify, youtube, boomplay, audiomack, tiktok, deezer, instagram, mdundo
```

Heuristics for going from data → weights:

- **Anchor on the user-count winners** — the platform with the most music-relevant users in that country gets the highest weight.
- **Discount social platforms vs. DSPs** — TikTok/Instagram have higher raw user counts than DSPs, but they're not direct streaming, so cap their weight below the DSP they compete with for attention. Exception: when a country's breakthrough mechanism is documented to flow through TikTok (e.g., SA amapiano), bump TikTok up.
- **Cumulative-trust signals matter for Reach** — followers/subscribers are part of the score, so platforms with sticky audiences (Spotify followers, YouTube subscribers) deserve weight even when their MAU is small.
- **Trim near-zero platforms to 0.01 minimum** — never set to 0.00 in case an artist surprises us with data there. The 0.01 floor keeps re-normalisation working and is small enough to not skew scores.
- **Floor sums must be 1.0000** when verified with `node -e`. The engine re-normalises across platforms-with-data anyway, so absolute weights matter less than ratios — but a 1.0 sum keeps the table self-documenting.

### Step 3 — Surface judgment calls

Present the proposed weights in a table comparing to the global default + any already-shipped countries. Always flag **2–3 explicit judgment calls** before coding — these are the places where defensible alternatives exist and the founder's market knowledge should dominate.

Example judgment calls from SA/NG:
- "Audiomack 0.30 vs Boomplay 0.18 — should they be flatter at 0.25/0.23 given Boomplay's pre-install reach?"
- "Spotify only 0.10 in NG — economic value vs raw user reach?"
- "TikTok at 0.20 vs 0.25 in SA — is amapiano the whole game?"

### Step 4 — Code it

After sign-off, add the country to `REACH_WEIGHT_OVERRIDES` in `lib/scoring/config.ts` with a **block comment above each profile** that:
- Names the data sources used
- Cites the date sourced (always)
- Explains each weight in 1–2 sentences linking to the underlying data point
- Flags any judgment calls that were made

### Step 5 — Verify

```bash
# Math check (must = 1.0000)
node -e "console.log((<all weights summed>).toFixed(4))"

# Type check
cd /sessions/sweet-confident-franklin/mnt/ROSTER/roster-V3
npx tsc --noEmit --pretty false 2>&1 | grep -v "experts/page.tsx"
```

The smoke test from earlier (`/sessions/sweet-confident-franklin/regional-math.js`) can be reused — feed synthetic snapshots through both global default and country profile, confirm scores differ in expected direction.

---

## 3. South Africa profile (shipped 2026-04-26)

### Data points pulled

| Source | Data point | Value | Date |
|---|---|---|---|
| Spotify Loud&Clear 2024 | SA artist royalties | R400m, +54% YoY | 2024 |
| Spotify Loud&Clear 2024 | First-time SA artist discoveries | 1.1B in 2024, +55% YoY | 2024 |
| IFPI Global Music Report 2025 | SA share of Sub-Saharan Africa revenue | 75–78% (~$83m of $110m) | 2024 |
| DataReportal Digital 2025 SA | TikTok users 18+ | 23.4M; adoption 34→38% | Jan 2025 |
| DataReportal Digital 2025 SA | Instagram users | 7.4M (+2.8% Q4'24→Jan'25) | Jan 2025 |
| Techpoint / Hypertext | YouTube users in SA | 25M | 2024 |
| GSMA Mobile Economy SSA 2024 | SA internet penetration | 74.7% (45.3M users) | Start 2024 |
| Boomplay press / Music In Africa | SA = "tier-one growth market" but secondary to NG/GH | qualitative | 2024 |
| Audiomack press / Pan-African Visions | Top-5 Android music app in 17 African countries; primary stronghold = NG | qualitative | 2024 |

### Weights

| Platform | Global default | **SA shipped** | Δ vs global |
|---|---:|---:|---:|
| spotify | 0.25 | **0.30** | +0.05 |
| youtube | 0.20 | **0.20** | — |
| tiktok | 0.10 | **0.20** | +0.10 |
| boomplay | 0.15 | **0.10** | −0.05 |
| audiomack | 0.10 | **0.07** | −0.03 |
| instagram | 0.05 | **0.07** | +0.02 |
| deezer | 0.10 | **0.04** | −0.06 |
| mdundo | 0.05 | **0.02** | −0.03 |
| **Sum** | **1.00** | **1.00** | |

### Rationale per weight (verbatim from `config.ts`)

- **Spotify 0.30** — Spotify Loud&Clear 2024: R400m to SA artists (+54% YoY), 1.1B SA artist discoveries by first-time listeners, 5+ years in market.
- **YouTube 0.20** — Techpoint: 25M SA users; YouTube Music in market since March 2019.
- **TikTok 0.20** — DataReportal Digital 2025 SA: 23.4M users 18+, adoption 34→38%, 2nd most-used social app. Documented amapiano breakthrough engine (Tyler ICU, Uncle Waffles, etc.)
- **Boomplay 0.10** — Boomplay press confirms SA = "tier-one growth market" but secondary to Nigeria/Ghana.
- **Audiomack 0.07** — Audiomack stronghold is Nigeria (15.3M MAU there); SA is top-5 Android music app but not #1.
- **Instagram 0.07** — 7.4M SA users; meaningful for Reels/marketing but smaller than TikTok.
- **Deezer 0.04** — Smallest SA subscriber base; francophone-heavy.
- **Mdundo 0.02** — East-Africa-focused, minimal SA presence.

### Judgment calls signed off

1. **TikTok at 0.20 (not 0.25)** — left at 0.20 because TikTok views don't directly monetise; Spotify/YouTube still ahead on formal usage.
2. **Audiomack at 0.07** — kept low despite amapiano artists' Audiomack presence; NG is its true stronghold.

---

## 4. Nigeria profile (shipped 2026-04-26)

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| Audiomack press / Music Ally Dec '24 | Audiomack NG MAU | **15.3M MAU**, 4.9M DAU; #1 music app on iOS+Android |
| Audiomack press | Cumulative Afrobeats streams since 2020 | 58 billion |
| Spotify Loud&Clear 2024 | NG artist royalties | ₦58bn (~$37.8M), +232% YoY (5× 2022) |
| Sensor Tower Q1 2024 | Spotify NG active users | ~1M MAU (peaked at 1.01M) |
| Spotify Wrapped 2024 NG | NG music consumption growth | +146% in 2024 |
| Boomplay press | Continent MAU | 90M; pre-installed on 50%+ NG smartphones via Transsion |
| TurntableCharts 2024 | Sony/AWAL boycott on royalty disputes | catalog quality affected |
| DataReportal Digital 2025 NG | TikTok users 18+ | 37.4M (+13.5M / +57% vs '24) |
| DataReportal Digital 2025 NG | Instagram users | 9.9M (-7% Q4'24 → Jan'25) |
| Techpoint | YouTube users in NG | 28M |

### Weights

| Platform | Global default | SA | **NG shipped** | Δ vs global |
|---|---:|---:|---:|---:|
| audiomack | 0.10 | 0.07 | **0.30** | +0.20 |
| youtube | 0.20 | 0.20 | **0.20** | — |
| boomplay | 0.15 | 0.10 | **0.18** | +0.03 |
| tiktok | 0.10 | 0.20 | **0.15** | +0.05 |
| spotify | 0.25 | 0.30 | **0.10** | −0.15 |
| instagram | 0.05 | 0.07 | **0.05** | — |
| deezer | 0.10 | 0.04 | **0.01** | −0.09 |
| mdundo | 0.05 | 0.02 | **0.01** | −0.04 |
| **Sum** | **1.00** | **1.00** | **1.00** | |

### Rationale per weight (verbatim from `config.ts`)

- **Audiomack 0.30** — 15.3M MAU in NG, NG is Audiomack's largest market globally, #1 music app on iOS+Android (Music Ally Dec '24, Audiomack press, Sensor Tower Q1'24).
- **YouTube 0.20** — 28M NG users, central for music videos and Afrobeats discovery (Techpoint).
- **Boomplay 0.18** — pre-installed on 50%+ NG smartphones via Transsion partnership; weakened by Sony/AWAL boycott over royalty disputes but still huge (Boomplay press, TurntableCharts 2024).
- **TikTok 0.15** — 37.4M NG users 18+ (DataReportal Jan '25), largest social platform in NG. Less central to NG breakthroughs than SA's amapiano-on-TikTok pattern — NG hits come more from labels + radio + YouTube.
- **Spotify 0.10** — only ~1M NG MAU (Sensor Tower Q1'24) but ₦58bn ($37.8M) royalties in 2024 (+232% YoY) — small user base, outsized economic value, +146% growth trajectory (Spotify Loud&Clear 2024).
- **Instagram 0.05** — 9.9M NG users, smaller than TikTok in NG (DataReportal Jan '25, declined 7% Q4'24 → Jan'25).
- **Deezer 0.01 / Mdundo 0.01** — negligible NG presence. Deezer is francophone-focused, Mdundo is East Africa.

### Judgment calls signed off

1. **Audiomack 0.30 vs Boomplay 0.18** — went with the Audiomack-leans-higher option. Audiomack's growth + clearly-named "#1 NG app" framing in press won out over Boomplay's Transsion pre-install reach.
2. **Spotify only 0.10** — used **user reach** as the metric, not economic importance. Spotify's high royalty per stream is real but Reach is a "people reached" score, not a "dollars earned" score. Economic importance belongs in a future metric we don't have yet.
3. **TikTok at 0.15 (not 0.18)** — went lower because NG breakthroughs (Burna Boy, Wizkid, Davido, Rema) come more from labels + radio + YouTube than TikTok virality. Afrobeats DOES go viral on TikTok globally but not as the discovery primary.

---

## 5. Code architecture (where everything lives)

### `lib/scoring/config.ts`

- `REACH_WEIGHTS` — the global default (Africa-friendly compromise). Used when an artist's country has no profile.
- `REACH_WEIGHT_OVERRIDES: Record<string, Record<Platform, number>>` — country profiles, keyed by canonical country name. Currently has SA + NG.
- `reachWeightsFor(country: string | null | undefined)` — returns the right weight set; falls back to the global default if country is null/undefined or has no override.

### `lib/scoring/index.ts`

- `scoreArtist(snapshots, opts?: { primaryCountry?: string | null })` — public entry. Engagement scoring is country-agnostic (it weights by the bot-resistance ladder, not by platform), so the country option only affects Reach + Momentum's reach-signal portion.
- `buildReach(snapshots, reachWeights)` — takes weights as a parameter (used to read `REACH_WEIGHTS` directly).
- `buildMomentum(snapshots, reachWeights)` — same; threads weights through for the reach-signal momentum half.

### `app/api/artists/route.ts`

In the `GET` handler's `shaped.map(...)`:

```ts
const primaryCountry: string | null = a.country ?? countriesArr[0] ?? null;
const scores: ArtistScores = scoreArtist(platformMetrics, { primaryCountry });
```

`a.country` is the legacy single-country column; `countriesArr[0]` is the multi-jurisdiction array's first entry. Falls through to null → global default.

### Country-name canonicalisation

Country names use exactly the strings stored in the `artists.country` column. The canonical names already in the codebase (per `app/api/artists/route.ts` `countryFlagFromName` map):

- "South Africa", "Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania", "Zimbabwe", "Ethiopia", "Egypt", "Morocco", "Algeria", "Côte d'Ivoire", "United Kingdom", "United States", "Jamaica", "Brazil", "France"

When adding a new profile, the key in `REACH_WEIGHT_OVERRIDES` MUST match this canonical name exactly — including the apostrophe in "Côte d'Ivoire".

---

## 6. Smoke test results

A pure-JS test (`/sessions/sweet-confident-franklin/regional-math.js`, deleted after run) verified the math. Three artist patterns tested under both global default and SA weights:

| Artist pattern | Global Reach | SA Reach | Δ | Interpretation |
|---|---:|---:|---:|---|
| TikTok-heavy (200k Spotify ML, 20M TikTok views, 500k TikTok followers, 150k IG) | 70.40 | 70.92 | +0.5 | Tiny Δ because narrow platform coverage means re-normalisation dominates |
| NG-pattern (300k Spotify ML, 5M Boomplay streams, 2M Audiomack plays) | 80.26 | 77.75 | **−2.5** | ✓ SA correctly down-weights NG-shaped artists |
| Full-platform mix with weak TikTok | 73.62 | 69.84 | **−3.8** | ✓ SA correctly punishes weak TikTok presence harder |

**Important behaviour finding from the smoke test:** regional weighting is most impactful when the artist has data on 5+ platforms. Narrow-coverage artists barely move because re-normalisation across platforms-with-data dominates. This is the right behaviour — we shouldn't claim regional precision when there isn't enough signal to differentiate.

---

## 7. Top 15 priority order — remaining 13 countries

Re-ordered from raw IFPI revenue rank to ROSTER's actual roster shape. Sub-Saharan markets first because that's where the active roster lives; North African markets last because they have a fundamentally different platform ecosystem (Anghami-dominant) and we don't track Anghami yet.

| Tier | Country | Status | Notes for when we resume |
|---|---|---|---|
| ✅ | South Africa | Shipped | — |
| ✅ | Nigeria | Shipped | — |
| **2** | Ghana | Pending | West Africa anglophone; mirrors NG roughly. Audiomack/Boomplay strong. Start here. |
| **3** | Kenya | Pending | East Africa lead. Mdundo + Boomplay dominate. Mdundo had 2.8M Kenya MAU (Jun 2022). Spotify still small. |
| **4** | Tanzania | Pending | Bongo Flava heart. Boomplay dominant (Diamond Platnumz, Zuchu, etc. all 200M+ Boomplay streams). Mdundo 2.4M MAU (Jun 2022). |
| **5** | Uganda | Pending | East Africa secondary. Mdundo relevant. TikTok is a major virality channel (Tupaate etc.). Smaller market overall. |
| **6** | Côte d'Ivoire | Pending | Francophone West — **Deezer matters here** (the only sub-Saharan country where Deezer should rise). Audiomack secondary. |
| **7** | Senegal | Pending | Francophone West. Similar to CIV but smaller. Deezer + YouTube. |
| **8** | Cameroon | Pending | Bilingual (Fr/En). Mixed platform pattern between Anglo-NG and Francophone West. Boomplay relevant via Transsion. |
| **9** | Zimbabwe | Pending | SADC; SA-adjacent platform mix. Smaller market. IFPI noted $13M revenue (tied with Morocco). |
| **10** | Ethiopia | Pending | Distinct local music industry; less integrated with pan-African DSPs. YouTube very dominant. Local platform Bekele Music exists. |
| **11** | Egypt | Pending | **Anghami-dominant** — flag this caveat. We don't track Anghami in `platforms.ts`. Profile will be incomplete. ~$30M IFPI 2023. |
| **12** | Morocco | Pending | Anghami + Deezer (francophone). Distinct music industry (raï etc.). |
| **13** | Algeria | Pending | Anghami + raï scene. North African pattern. |
| **14** | Tunisia | Pending | Anghami + francophone overlap. Smallest of the North African group. |

### Anghami caveat for Tier 11–14

Anghami is the dominant Arabic-region DSP (claims 70M+ MAU concentrated in MENA). We currently don't track Anghami in `lib/scoring/platforms.ts` — so any North African profile we ship today would be missing the platform that matters most there.

**Options when we get to that batch:**
1. **Add Anghami to `platforms.ts` first** — defines metrics (followers, plays_28d, listeners), adds calibration constants in `config.ts` (REACH_MAX, ENGAGEMENT_MAX, MOMENTUM_SHARE), surfaces it in the Update Stats modal. Probably 1–2 hours of work. Then ship North African profiles with Anghami included.
2. **Ship North African profiles without Anghami** — they'll be incomplete and bias toward whatever we DO track (YouTube, Spotify, TikTok). Cleaner now, but the resulting scores will under-represent reality for any Egyptian/Moroccan/Algerian/Tunisian artists you onboard.

Recommend option 1 when we reach that batch.

### Suggested batching for resumption

- **Batch A (anglophone Sub-Saharan):** Ghana, Kenya, Tanzania, Uganda. Similar Audiomack/Boomplay/Mdundo pattern, efficient as a group.
- **Batch B (francophone West/Central):** Côte d'Ivoire, Senegal, Cameroon. Deezer dynamics.
- **Batch C (southern + horn):** Zimbabwe, Ethiopia. Distinct from each other but both small markets.
- **Batch D (North Africa):** Egypt, Morocco, Algeria, Tunisia. Add Anghami first.

---

## 8. Reusable research checklist (per country)

Copy this into the briefing for each new country:

```
Country: <name>

Population data:
[ ] Internet users (DataReportal or GSMA)
[ ] Smartphone penetration (GSMA)

DSP usage (in priority order):
[ ] Spotify Loud&Clear country royalty figure (annual)
[ ] Spotify MAU estimate (Sensor Tower if available, otherwise inferred)
[ ] Audiomack MAU (named figure or qualitative)
[ ] Boomplay MAU / pre-install partnerships
[ ] Mdundo MAU (LinkedIn investor disclosures)
[ ] YouTube user count (Techpoint/DataReportal)
[ ] Deezer presence (qualitative — francophone weighted)
[ ] Mdundo presence (qualitative — East Africa weighted)
[ ] Apple Music presence (we don't track it but useful sanity check on Spotify weight)

Social platforms (DataReportal Digital `<year>: <country>`):
[ ] TikTok users 18+ + YoY growth
[ ] Instagram users + Q4 trend
[ ] Facebook users (sanity check, not in our scoring)

Qualitative signals:
[ ] Discovery mechanisms (TikTok virality? Radio? Editorial playlists?)
[ ] Local DSPs that aren't in our 8-platform set (flag as Anghami-style caveat)
[ ] Royalty disputes / catalogue boycotts that affect platform health

Output:
[ ] Sourced weight table summing to 1.0000
[ ] 2–3 explicit judgment calls flagged for sign-off
[ ] Sources list with markdown links and dates
```

---

## 9. Maintenance notes

- **Annual refresh:** re-run after IFPI Global Music Report (March/April) and Spotify Loud&Clear (March). DataReportal updates each January. Re-pull the latest numbers and update inline comments with new dates.
- **When adding a new platform** to `lib/scoring/platforms.ts`: every country profile in `REACH_WEIGHT_OVERRIDES` must be updated to include the new platform key, sums must be re-balanced to 1.0. The TypeScript `Record<Platform, number>` type will catch missing keys at compile time — that's intentional.
- **When a country isn't in `REACH_WEIGHT_OVERRIDES`:** falls through to global default. Safe behaviour. Adding a country is purely additive.
- **The `regional-test.mjs` file** in the project root is an empty leftover from debugging — safe to delete (`rm regional-test.mjs`). I couldn't remove it from the sandbox due to permissions.

---

## 10. Reference: what's currently in `config.ts`

For sanity-checking the running code:

```ts
export const REACH_WEIGHTS: Record<Platform, number> = {
  spotify: 0.25,
  youtube: 0.2,
  boomplay: 0.15,
  audiomack: 0.1,
  tiktok: 0.1,
  deezer: 0.1,
  instagram: 0.05,
  mdundo: 0.05,
};

export const REACH_WEIGHT_OVERRIDES: Record<string, Record<Platform, number>> = {
  "South Africa": {
    spotify: 0.3,  youtube: 0.2,  tiktok: 0.2,    boomplay: 0.1,
    audiomack: 0.07, instagram: 0.07, deezer: 0.04, mdundo: 0.02,
  },
  Nigeria: {
    audiomack: 0.3, youtube: 0.2,  boomplay: 0.18, tiktok: 0.15,
    spotify: 0.1,   instagram: 0.05, deezer: 0.01, mdundo: 0.01,
  },
};

export function reachWeightsFor(
  primaryCountry: string | null | undefined
): Record<Platform, number> {
  if (!primaryCountry) return REACH_WEIGHTS;
  return REACH_WEIGHT_OVERRIDES[primaryCountry] ?? REACH_WEIGHTS;
}
```

If the running code drifts from this, the inline comments above each profile in `config.ts` are the source of truth for sourcing.
