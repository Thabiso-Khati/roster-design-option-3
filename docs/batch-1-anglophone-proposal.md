# ROSTER — Batch 1 Regional Profile Proposal: Ghana / Kenya / Tanzania / Uganda

**Status:** DRAFT for review. Not committed to code.
**Author:** Claude, prepared while Thabiso was AFK.
**Methodology:** per `/docs/regional-weighting.md` § 2 (free public sources only).

When you sign off, I'll commit each profile to `REACH_WEIGHT_OVERRIDES` in `lib/scoring/config.ts` with inline source comments — same pattern as SA + NG.

---

## How to use this doc

1. Skim each country's data table to confirm the numbers feel right against your on-the-ground knowledge.
2. Read each weight table — push back on anything that surprises you.
3. Pay attention to the **"Judgment calls"** section for each country — those are the places where defensible alternatives exist and your call dominates.
4. Reply with sign-off (or amendments) and I commit.

---

## Ghana

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2025 Ghana | Social media users (Jan 2025) | 7.95M (23% pop, 39.2% of adults) |
| DataReportal Digital 2025 Ghana | Instagram users | 2.15M |
| Sensor Tower Q1 2024 | Audiomack Ghana | 2.4M weekly active users |
| Sensor Tower Q1 2024 | Boomplay Ghana | ~600k weekly active users |
| Audiomack press | "Top music app" framing | confirmed for Ghana |
| Music In Africa | Aftown launching Nov 2024 | new local platform — **not** in our 8-platform set |

### The market shape (plain English)

Ghana mirrors Nigeria's pattern but smaller — Audiomack-first, Boomplay second, YouTube central for Afrobeats music videos, TikTok significant for virality. Spotify is rising but tiny. The new local Aftown platform doesn't show up in our scoring engine yet — flagging for future addition if it gains scale.

### Proposed Ghana Reach weights

| Platform | Global default | NG | **Ghana (proposed)** | Rationale |
|---|---:|---:|---:|---|
| audiomack | 0.10 | 0.30 | **0.28** | Same dominance pattern as NG but on a smaller user base (2.4M vs NG 15.3M) |
| youtube | 0.20 | 0.20 | **0.22** | Music videos are central in Ghanaian Afrobeats; slightly more than NG |
| boomplay | 0.15 | 0.18 | **0.18** | Similar to NG — Transsion pre-install carries it |
| tiktok | 0.10 | 0.15 | **0.15** | Significant but Afrobeats discovery still skews to YouTube/radio |
| spotify | 0.25 | 0.10 | **0.10** | Same as NG — small user base, growing |
| instagram | 0.05 | 0.05 | **0.05** | 2.15M users; secondary social platform |
| deezer | 0.10 | 0.01 | **0.01** | Negligible — francophone focus |
| mdundo | 0.05 | 0.01 | **0.01** | Negligible — East Africa focus |
| **Sum** | **1.00** | **1.00** | **1.00** | ✓ |

### Ghana judgment calls

1. **Audiomack 0.28 vs Boomplay 0.18** — kept Audiomack ahead by similar margin to NG. If you think Boomplay's pre-install advantage is bigger in Ghana than Nigeria (Transsion's Tecno is everywhere there), I can flatten to 0.25/0.20.
2. **YouTube 0.22 (1pp higher than NG)** — slightly elevated because Ghanaian Afrobeats consumption skews more to music videos than NG's. Push to 0.20 if you'd rather match NG exactly.

---

## Kenya

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2025 Kenya | Internet users (Jan 2025) | 27.4M (48% penetration) |
| DataReportal Digital 2025 Kenya | Social media users | 15.1M (26.5% pop) |
| DataReportal Digital 2025 Kenya | TikTok share of social users | 29.5% (~4.5M) |
| Business Daily | TikTok growth 2024 | +4.72M (+34.6%) |
| DataReportal Digital 2025 Kenya | YouTube share | 26.2% (~4M) |
| LinkedIn (Mdundo investor disclosure, Jun 2022) | Mdundo Kenya MAU | 2.8M |
| Boomplay press | Kenya = "tier-one" market | qualitative |
| Mdundo press | Mdundo continent MAU (Sep 2024) | 36M |

### The market shape

Kenya is **East Africa's anchor** and fundamentally different from West Africa's pattern. Mdundo (Kenya-founded) has its strongest position here. Boomplay is also dominant. Spotify is rising but still smaller than the local-first players. TikTok is meaningful but not the same scale as in NG/SA. YouTube is solid for music videos.

### Proposed Kenya Reach weights

| Platform | Global default | **Kenya (proposed)** | Rationale |
|---|---:|---:|---|
| mdundo | 0.05 | **0.20** | Kenya = Mdundo's home market and stronghold (2.8M MAU disclosure, 11+ year platform history) |
| boomplay | 0.15 | **0.20** | Tier-one market for Boomplay alongside NG/Tanzania |
| youtube | 0.20 | **0.18** | ~4M Kenya users, music video presence |
| tiktok | 0.10 | **0.15** | 4.5M users, growing fast (+34.6% in '24) but not Afrobeats-tier discovery |
| spotify | 0.25 | **0.12** | Rising — but still much smaller than Mdundo/Boomplay |
| audiomack | 0.10 | **0.07** | Present but less dominant than in West Africa |
| instagram | 0.05 | **0.05** | Smaller than TikTok in Kenya |
| deezer | 0.10 | **0.03** | Has presence but minimal vs Boomplay/Mdundo |
| **Sum** | **1.00** | **1.00** | ✓ |

### Kenya judgment calls

1. **Mdundo 0.20 vs Boomplay 0.20 (tied)** — gave them equal weight. If you think Mdundo deserves the edge as the home-grown player, I can shift to 0.22/0.18.
2. **Spotify 0.12 (higher than NG's 0.10)** — Kenya's English-speaking middle class has adopted Spotify faster than West Africa relatively. Push to 0.10 if you'd rather match the rest of Africa's Spotify weight.
3. **Deezer 0.03 (slightly higher than NG's 0.01)** — East Africa has more Deezer presence than West Africa due to broader DSP reach in EA. Cut to 0.01 if you want to be stricter.

---

## Tanzania

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| Tanzania Communications Regulatory Authority | Internet subscriptions (Sep 2025) | 56.3M (note: subscriptions ≠ unique users — many SIM cards per person) |
| Mdundo investor disclosure (Jun 2022) | Mdundo Tanzania MAU | 2.4M |
| Music In Africa | Mbosso surpassed 200M Boomplay streams | Boomplay scale for Bongo Flava |
| Music In Africa qualitative | Diamond Platnumz, Zuchu, Rayvanny — all Boomplay-first | Boomplay dominant in Bongo Flava |
| The Citizen 2024 | "TikTok and Instagram are the new performance stages" for Bongo Flava | qualitative virality engine |
| The Citizen 2024 | Top 2024 Tanzanian songs | 500M+ combined streams |

### The market shape

Tanzania is **Bongo Flava's heartland** and the platform pattern reflects it. Boomplay is the absolute giant — top Tanzanian artists log 200M+ streams there individually. Mdundo is meaningful (2.4M MAU). TikTok is rising fast as the discovery engine, especially for the genre. Spotify is small. Audiomack has less footprint than in West Africa.

**Weakest data set of the four** — couldn't find a clean DataReportal Tanzania extract. Numbers below lean more on qualitative ground-truth than I'd like.

### Proposed Tanzania Reach weights

| Platform | Global default | **Tanzania (proposed)** | Rationale |
|---|---:|---:|---|
| boomplay | 0.15 | **0.28** | Bongo Flava heart — top artists generate 200M+ Boomplay streams individually |
| youtube | 0.20 | **0.20** | Music videos are central; East Africa's broadcast culture |
| mdundo | 0.05 | **0.15** | 2.4M Tanzania MAU disclosure, secondary local DSP |
| tiktok | 0.10 | **0.15** | "New performance stage" for Bongo Flava per industry coverage |
| spotify | 0.25 | **0.10** | Small but present, growing |
| audiomack | 0.10 | **0.05** | Has less foothold here than in West Africa |
| instagram | 0.05 | **0.05** | Standard secondary social |
| deezer | 0.10 | **0.02** | Negligible |
| **Sum** | **1.00** | **1.00** | ✓ |

### Tanzania judgment calls

1. **Boomplay at 0.28 (single biggest in any country profile so far)** — driven by the Bongo Flava streaming dominance. If you think this overweights one platform, I can drop to 0.25 and bump YouTube to 0.23.
2. **Audiomack only 0.05** — went lower than the pan-African default because Tanzania isn't an Audiomack stronghold. Bump to 0.07 if you've seen evidence otherwise.
3. **Data quality flag** — DataReportal Tanzania access was blocked in research. If you have access to that report, sharing the TikTok/Instagram numbers would tighten the percentages.

---

## Uganda

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2025 Uganda | Internet users (Jan 2025) | 14.2M (28% penetration) |
| DataReportal Digital 2025 Uganda | Social media user identities | 2.40M (4.7% pop) — note far below internet user count |
| ChimpReports / UCC | TikTok users in Uganda | **5.5M** |
| DataReportal Digital 2025 Uganda | YouTube users | 4.7M |
| DataReportal Digital 2025 Uganda | WhatsApp users | 7.6M |
| DataReportal Digital 2025 Uganda | Instagram users | 790k |
| DataReportal Digital 2025 Uganda | Smartphone penetration | 33% |

### The market shape

Uganda is **the most TikTok-dominated** of the four. 5.5M TikTok users in a 14.2M-internet-user market = 39% penetration of online users — extraordinarily high relative to Kenya (16%) or Ghana. WhatsApp is the absolute biggest social platform but we don't track it for music. YouTube is strong (4.7M users). Mdundo and Boomplay are both relevant given regional pattern. Spotify is small. Instagram is tiny (790k).

### Proposed Uganda Reach weights

| Platform | Global default | **Uganda (proposed)** | Rationale |
|---|---:|---:|---|
| tiktok | 0.10 | **0.20** | 5.5M users — 39% of internet users on TikTok; biggest social music platform in UG |
| youtube | 0.20 | **0.20** | 4.7M users; central for music videos |
| boomplay | 0.15 | **0.18** | Strong East Africa foothold |
| mdundo | 0.05 | **0.15** | Mdundo's regional reach extends well into UG |
| spotify | 0.25 | **0.10** | Small (smartphone penetration 33% caps Spotify reach) |
| audiomack | 0.10 | **0.07** | Present but not dominant |
| instagram | 0.05 | **0.05** | Only 790k users |
| deezer | 0.10 | **0.05** | Slightly higher than NG/GH because of less Audiomack/Boomplay substitution |
| **Sum** | **1.00** | **1.00** | ✓ |

### Uganda judgment calls

1. **TikTok at 0.20 (matching SA's weight)** — driven by the 39% TikTok-of-internet-users ratio. If you think this is still too high (5.5M is large but absolute scale is smaller than SA's 23.4M), I can drop to 0.18.
2. **Mdundo 0.15 (tied with Tanzania, lower than Kenya's 0.20)** — Kenya is Mdundo's home market so it gets the highest. UG/TZ as regional satellites get 0.15. Reasonable?
3. **Deezer 0.05** — kept slightly higher than NG/GH because Uganda has fewer competing African DSPs, so Deezer's slot grows. Could drop to 0.03 if you'd rather.

---

## Cross-batch sanity check

Side-by-side weight comparison so you can see the pattern:

| Platform | Global | SA | NG | GH | KE | TZ | UG |
|---|---:|---:|---:|---:|---:|---:|---:|
| spotify | 0.25 | 0.30 | 0.10 | 0.10 | 0.12 | 0.10 | 0.10 |
| youtube | 0.20 | 0.20 | 0.20 | 0.22 | 0.18 | 0.20 | 0.20 |
| audiomack | 0.10 | 0.07 | 0.30 | 0.28 | 0.07 | 0.05 | 0.07 |
| boomplay | 0.15 | 0.10 | 0.18 | 0.18 | 0.20 | **0.28** | 0.18 |
| tiktok | 0.10 | 0.20 | 0.15 | 0.15 | 0.15 | 0.15 | 0.20 |
| instagram | 0.05 | 0.07 | 0.05 | 0.05 | 0.05 | 0.05 | 0.05 |
| deezer | 0.10 | 0.04 | 0.01 | 0.01 | 0.03 | 0.02 | 0.05 |
| mdundo | 0.05 | 0.02 | 0.01 | 0.01 | **0.20** | 0.15 | 0.15 |

Patterns I'd expect you to recognise:
- **Spotify 0.30 in SA, 0.10–0.12 everywhere else** — reflects how much further Spotify has penetrated SA vs the rest of the continent
- **Audiomack 0.30 in NG / 0.28 in GH, 0.05–0.07 elsewhere** — West African anglophone stronghold
- **Boomplay 0.28 in TZ** — single highest weight for any platform in any country, reflecting Bongo Flava dominance
- **Mdundo 0.20 in KE** — only meaningful weight; East Africa-only platform
- **TikTok 0.20 in SA + UG, 0.15 elsewhere** — SA for amapiano, UG for sheer market penetration

If any of these patterns feel wrong, that's the place to push back.

---

## Sources

- [Digital 2025: Ghana — DataReportal](https://datareportal.com/reports/digital-2025-ghana)
- [Digital 2025: Kenya — DataReportal](https://datareportal.com/reports/digital-2025-kenya)
- [Digital 2025: Uganda — DataReportal](https://datareportal.com/reports/digital-2025-uganda)
- [Top 5 Music & Audio Apps in Ghana Q1 2024 — Sensor Tower](https://sensortower.com/blog/2024-q1-unified-top-5-music%20and%20podcasts-units-gh-64c7e0f6e1714cfff17dc5e6)
- [Kenyan-Based & Pan-African Music Service Mdundo Crosses 20M+ Monthly Active Users (MAUs) In June 2022 — LinkedIn](https://www.linkedin.com/pulse/kenyan-based-pan-african-music-service-mdundo-crosses-moses-kemibaro)
- [Tanzania: Mbosso surpasses 200 million streams on Boomplay — Music In Africa](https://www.musicinafrica.net/magazine/tanzania-mbosso-surpasses-200-million-streams-boomplay)
- [From TikTok to the world: The new era of Bongo Flava promotion — The Citizen](https://www.thecitizen.co.tz/tanzania/magazines/from-tiktok-to-the-world-the-new-era-of-bongo-flava-promotion-4702864)
- [Uganda: TikTok Users Hit 5.5 Million — ChimpReports](https://chimpreports.com/ucc-report-20-million-ugandans-on-social-media/)
- [Kenya's digital rebound TikTok leads social media 3.3m users surge — Business Daily](https://www.businessdailyafrica.com/bd/corporate/technology/digital-rebound-tiktok-leads-social-media-3-3m-users-surge-5290296)
- [How Boomplay is monetizing music for African artists — Quartz](https://qz.com/africa/2121253/chinas-boomplay-is-dominating-africas-music-streaming-market)

---

## Sign-off prompt

To accept all four as-drafted: "Ship Batch 1 as drafted."

To accept with amendments: "Ship Batch 1 with these changes: [your edits]."

To reject any country: "Skip [country] for now — needs more research."

Once signed off I'll commit each profile to `REACH_WEIGHT_OVERRIDES` with full inline source comments mirroring the SA + NG style.
