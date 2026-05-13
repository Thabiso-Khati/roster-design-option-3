# ROSTER — Batch 2 Regional Profile Proposal: Côte d'Ivoire / Senegal / Cameroon

**Status:** DRAFT for review. Not committed to code.
**Author:** Claude, prepared while Thabiso was AFK.
**Methodology:** per `/docs/regional-weighting.md` § 2.

When you sign off, I'll commit each profile to `REACH_WEIGHT_OVERRIDES` in `lib/scoring/config.ts` with inline source comments — same pattern as SA + NG.

---

## Pattern note: Francophone Africa is different

**Why these three are batched together:** francophone West + Central Africa has a fundamentally different DSP shape than anglophone neighbours. The headline difference is **Deezer**.

- Deezer entered Côte d'Ivoire in 2016 via partnership with **Orange** (Deezer is a major Deezer shareholder). Orange Money + Deezer Premium bundles drove early adoption.
- Followed by Senegal (2017) and Cameroon (2018).
- Deezer reported 200k subscribers + €1.5M revenue across these three by late 2018 — and that was 7+ years ago. Now meaningfully larger.
- Anglophone neighbours (NG, GH, KE) have basically zero Deezer presence; here it's a real player.

**Honest data quality flag:** francophone-Africa market data is thinner than anglophone in public sources. DataReportal covers them all but blocks WebFetch from my side; numbers below come from search-result extracts plus older industry reports. Recommend tighter refresh once we have 1+ active artist in any of these markets.

---

## Côte d'Ivoire

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| Music In Africa / Jeune Afrique | Deezer entered Côte d'Ivoire | 2016 |
| Jeune Afrique | Deezer subscribers (CI + SN + CM combined) | 200k subs / €1.5M rev (2018) |
| Boomplay press | Boomplay launched in CI | 2022 (has CI office) |
| Quartz Africa | Boomplay continent MAU | 90M (2024) |
| Music In Africa | Smartphone penetration in CI | 128% (very high — multi-SIM market) |
| GSMA SSA 2024 (regional) | Internet user growth CI | +2.4% in 2024 |

### The market shape

**Deezer-significant market** thanks to Orange partnership — biggest Deezer footprint in sub-Saharan Africa. Boomplay is growing fast (CI office), Audiomack has presence but less central than in West African anglophone. YouTube remains music-video king. TikTok rising.

### Proposed Côte d'Ivoire Reach weights

| Platform | Global default | **CI (proposed)** | Rationale |
|---|---:|---:|---|
| youtube | 0.20 | **0.20** | Music videos remain central |
| boomplay | 0.15 | **0.18** | CI office + growing presence post-2022 launch |
| deezer | 0.10 | **0.18** | Orange partnership; CI is Deezer's strongest sub-Saharan position |
| tiktok | 0.10 | **0.15** | Significant but not yet music-discovery-dominant |
| spotify | 0.25 | **0.12** | Real but smaller than Deezer here |
| audiomack | 0.10 | **0.10** | Has presence but not dominant |
| instagram | 0.05 | **0.05** | Standard secondary social |
| mdundo | 0.05 | **0.02** | East-Africa-focused, minimal CI |
| **Sum** | **1.00** | **1.00** | ✓ |

### CI judgment calls

1. **Deezer at 0.18 (almost double the global default)** — flagging as possibly too high if Deezer's actual current footprint has plateaued post-Orange-partnership novelty. If you've heard CI artists complaining about low Deezer payouts vs Boomplay, drop Deezer to 0.14 and bump Boomplay to 0.20 + Audiomack to 0.12.
2. **Spotify 0.12 vs Deezer 0.18** — went with Deezer ahead because of the Orange ecosystem. If you'd rather treat Spotify and Deezer as roughly equal in CI, swap to 0.15/0.15.

---

## Senegal

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2025 Senegal | Social media user identities | 5.01M (26.8% pop) |
| Music In Africa / Jeune Afrique | Deezer entered Senegal | 2017 |
| Various (Favikon / StarNgage) | Top SN TikTok creators | 1M+ followers (Viviane Chidid, DKMaharé) — vibrant TikTok ecosystem |
| Beats of Africa | Senegalese mbalax + Afrobeats blend on global TikTok charts | 2024–25 |

### The market shape

Smaller market than CI but **vibrant TikTok scene**. Mbalax artists and Afrobeats crossovers go viral on TikTok regularly. Deezer is present (Orange ecosystem extends here) but with less subscriber base than CI. Boomplay is rolling out. Audiomack has a foothold thanks to Senegalese Afrobeats/hip-hop scene crossover with Nigerian/Ghanaian artists.

### Proposed Senegal Reach weights

| Platform | Global default | **SN (proposed)** | Rationale |
|---|---:|---:|---|
| youtube | 0.20 | **0.20** | Standard music-video-central |
| tiktok | 0.10 | **0.18** | Documented vibrant TikTok music scene; mbalax + Afrobeats viralisation |
| boomplay | 0.15 | **0.15** | Standard West-Africa Boomplay presence |
| deezer | 0.10 | **0.15** | Orange partnership extends here; less than CI but real |
| spotify | 0.25 | **0.12** | Present, growing |
| audiomack | 0.10 | **0.12** | West-African hip-hop / Afrobeats spillover |
| instagram | 0.05 | **0.05** | Standard secondary social |
| mdundo | 0.05 | **0.03** | Minimal — Mdundo East Africa focus |
| **Sum** | **1.00** | **1.00** | ✓ |

### SN judgment calls

1. **TikTok 0.18 (higher than CI's 0.15)** — based on the qualitative "vibrant TikTok music scene" framing in industry coverage. If you think SN's TikTok is comparable to CI's, drop to 0.15 and add 0.03 to Boomplay or Deezer.
2. **Audiomack 0.12 (1pp higher than CI)** — assumes Senegal's hip-hop scene leans more Audiomack than CI. Could equalise both at 0.10 if you'd rather.
3. **Deezer 0.15 vs CI's 0.18** — kept slightly lower because the Orange partnership originated in CI and is most penetrated there. Equalise at 0.15 if you think the Orange ecosystem is uniform across francophone WA.

---

## Cameroon

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2025 Cameroon | Internet users (Jan 2025) | 12.4M (41.9% penetration) |
| DataReportal Digital 2025 Cameroon | Social media user identities | 5.45M (18.5% pop) |
| DataReportal Digital 2025 Cameroon | Instagram users | 600k (2.0% pop) |
| Music In Africa / Jeune Afrique | Deezer entered Cameroon | 2018 |
| Boomplay press | Cameroon office confirmed | yes |
| Cameroon population | 29.5M (Jan 2025) | bilingual EN/FR |

### The market shape

**Bilingual market** — straddles francophone West/Central and anglophone West/Central. Music industry reflects this: Cameroonian artists work between Boomplay (anglophone strength), Audiomack (Afrobeats spillover), and Deezer (francophone Orange ecosystem). Boomplay has actual offices here (one of their listed African operating countries). YouTube is universal. TikTok is rising.

### Proposed Cameroon Reach weights

| Platform | Global default | **CM (proposed)** | Rationale |
|---|---:|---:|---|
| boomplay | 0.15 | **0.20** | CM = listed Boomplay operating country with office |
| youtube | 0.20 | **0.20** | Standard music-video-central |
| audiomack | 0.10 | **0.18** | Afrobeats spillover + bilingual catalog appeal |
| tiktok | 0.10 | **0.15** | Rising but not yet dominant |
| spotify | 0.25 | **0.10** | Present but small relative to Boomplay/Audiomack |
| deezer | 0.10 | **0.10** | Real (Orange ecosystem) but smaller foothold than CI/SN |
| instagram | 0.05 | **0.05** | 600k users; standard secondary |
| mdundo | 0.05 | **0.02** | Minimal |
| **Sum** | **1.00** | **1.00** | ✓ |

### CM judgment calls

1. **Boomplay 0.20 (joint highest with Tanzania at 0.28 — wait, CM at 0.20 vs TZ at 0.28)** — kept CM lower than TZ because Bongo Flava on Boomplay is more concentrated than CM's mixed market. Bump to 0.22 if you think CM's bilingual catalog favours Boomplay more.
2. **Audiomack 0.18** — high because of Afrobeats spillover from NG/GH. If you've seen evidence CM artists don't actually publish heavily on Audiomack, drop to 0.12 and add to Boomplay.
3. **Deezer 0.10 (lower than CI's 0.18 and SN's 0.15)** — went lower because Orange partnership is less concentrated in Cameroon. Push to 0.12 if you'd rather keep francophone Deezer treatment more uniform.

---

## Cross-batch sanity check (extending the SA/NG/Batch1 table)

| Platform | Global | SA | NG | GH | KE | TZ | UG | **CI** | **SN** | **CM** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| spotify | 0.25 | 0.30 | 0.10 | 0.10 | 0.12 | 0.10 | 0.10 | **0.12** | **0.12** | **0.10** |
| youtube | 0.20 | 0.20 | 0.20 | 0.22 | 0.18 | 0.20 | 0.20 | **0.20** | **0.20** | **0.20** |
| audiomack | 0.10 | 0.07 | 0.30 | 0.28 | 0.07 | 0.05 | 0.07 | **0.10** | **0.12** | **0.18** |
| boomplay | 0.15 | 0.10 | 0.18 | 0.18 | 0.20 | 0.28 | 0.18 | **0.18** | **0.15** | **0.20** |
| tiktok | 0.10 | 0.20 | 0.15 | 0.15 | 0.15 | 0.15 | 0.20 | **0.15** | **0.18** | **0.15** |
| instagram | 0.05 | 0.07 | 0.05 | 0.05 | 0.05 | 0.05 | 0.05 | **0.05** | **0.05** | **0.05** |
| deezer | 0.10 | 0.04 | 0.01 | 0.01 | 0.03 | 0.02 | 0.05 | **0.18** | **0.15** | **0.10** |
| mdundo | 0.05 | 0.02 | 0.01 | 0.01 | 0.20 | 0.15 | 0.15 | **0.02** | **0.03** | **0.02** |

Patterns to verify:
- **Deezer 0.18 / 0.15 / 0.10 in CI / SN / CM** — by far the highest Deezer weights anywhere. Reflects francophone West/Central reality. If this looks wrong, this is the place to push back.
- **Audiomack 0.10–0.18 in francophone, 0.28–0.30 in anglophone West** — meaningful step-down reflects the language gravity.
- **No country has Boomplay below 0.10** — it's a pan-African universal floor.

---

## Sources

- [Digital 2025: Senegal — DataReportal](https://datareportal.com/reports/digital-2025-senegal)
- [Digital 2025: Cameroon — DataReportal](https://datareportal.com/reports/digital-2025-cameroon)
- [Digital 2025: Côte d'Ivoire — DataReportal](https://datareportal.com/digital-in-cote-d-ivoire)
- [Musique en ligne : les streamers entrent dans la danse — Jeune Afrique](https://www.jeuneafrique.com/mag/799562/economie/musique-en-ligne-les-streamers-entrent-dans-la-danse/)
- [How Boomplay is monetizing music for African artists — Quartz](https://qz.com/africa/2121253/chinas-boomplay-is-dominating-africas-music-streaming-market)
- [Deezer slashes prices in more African countries — Music In Africa](https://www.musicinafrica.net/magazine/deezer-slashes-prices-more-african-countries)
- [Age Groups and Internet Use in Cameroon, Côte d'Ivoire, and Senegal Explored — Ecofin Agency](https://www.ecofinagency.com/news/0307-47529-age-groups-and-internet-use-in-cameroon-cote-d-ivoire-and-senegal-explored)
- [The Quiet Takeover: How Francophone Afropop is Conquering Global Charts — Beats of Africa](https://thebeatsofafrica.com/beats-news/explore/francophone-afropop-global-rise/)
- [37 Deezer Music Statistics For 2025 — Tone Island](https://toneisland.com/deezer-statistics/)

---

## Sign-off prompt

To accept all three as-drafted: "Ship Batch 2 as drafted."

To accept with amendments: "Ship Batch 2 with these changes: [your edits]."

To reject any country: "Skip [country] for now — needs more research."

---

## What's left after Batches 1 + 2

| Tier | Status |
|---|---|
| ✅ South Africa | Shipped |
| ✅ Nigeria | Shipped |
| 📝 Ghana | Drafted (Batch 1) |
| 📝 Kenya | Drafted (Batch 1) |
| 📝 Tanzania | Drafted (Batch 1) |
| 📝 Uganda | Drafted (Batch 1) |
| 📝 Côte d'Ivoire | Drafted (Batch 2) |
| 📝 Senegal | Drafted (Batch 2) |
| 📝 Cameroon | Drafted (Batch 2) |
| ⏳ Zimbabwe | Pending (Batch 3) |
| ⏳ Ethiopia | Pending (Batch 3) |
| ⏳ Egypt | Pending (Batch 4 — needs Anghami first) |
| ⏳ Morocco | Pending (Batch 4 — needs Anghami) |
| ⏳ Algeria | Pending (Batch 4 — needs Anghami) |
| ⏳ Tunisia | Pending (Batch 4 — needs Anghami) |
