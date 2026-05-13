# ROSTER — Batch 3 Regional Profile Proposal: Zimbabwe / Ethiopia

**Status:** DRAFT for review. Not committed to code.
**Author:** Claude, prepared while Thabiso was AFK.
**Methodology:** per `/docs/regional-weighting.md` § 2.

When you sign off, I'll commit each profile to `REACH_WEIGHT_OVERRIDES` in `lib/scoring/config.ts` with inline source comments — same pattern as SA + NG.

---

## Pattern note: two very different markets

These two are batched together purely because they're each one country and small in volume — they're **not** part of a coherent regional pattern.

- **Zimbabwe** is SADC, SA-adjacent, smaller version of the southern Africa pattern. Sungura and Zimdancehall are distinct local genres but the platform mix mirrors SA more than NG.
- **Ethiopia** is fundamentally unique — Amharic-dominated local music industry, a YouTube-first consumption culture, and the local Sewasew Multimedia platform that we don't track. Adding Ethiopia at all means accepting that the profile will be incomplete until/unless we add Sewasew.

---

## Zimbabwe

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2025 Zimbabwe | Internet users (Jan 2025) | 6.45M (38.4% penetration) |
| DataReportal Digital 2025 Zimbabwe | Social media user identities | 2.10M (12.5% pop) |
| DataReportal Digital 2025 Zimbabwe | Instagram users | 544k |
| Matebeleland Pulse | Platform order in ZW | Facebook > WhatsApp > TikTok > Instagram |
| Techpoint Africa | Warner-Audiomack expansion | Zimbabwe included in 2024 deal |
| IFPI 2023 (regional totals) | Zimbabwe recorded music revenue | ~$13M (tied with Morocco) |

### The market shape

SADC region, SA-adjacent platform pattern. Boomplay has solid presence (Africa-wide focus). Spotify has spillover from SA. Audiomack just got Warner catalog expansion in 2024. TikTok is rising. Distinct local genres (Sungura, Zimdancehall) but the platform delivery mirrors regional norms.

### Proposed Zimbabwe Reach weights

| Platform | Global default | **ZW (proposed)** | Rationale |
|---|---:|---:|---|
| youtube | 0.20 | **0.20** | Standard music-video-central |
| boomplay | 0.15 | **0.18** | Strong Africa-wide presence; SADC reach |
| spotify | 0.25 | **0.15** | SA-adjacent spillover; higher than NG/GH but lower than SA |
| tiktok | 0.10 | **0.15** | Rising; documented platform-order ranking |
| audiomack | 0.10 | **0.15** | Warner catalog expansion brought Zimdancehall in scale |
| deezer | 0.10 | **0.07** | SADC has more Deezer than West Africa anglophone |
| instagram | 0.05 | **0.05** | 544k users, smaller than TikTok |
| mdundo | 0.05 | **0.05** | Mdundo's pan-African reach extends to ZW |
| **Sum** | **1.00** | **1.00** | ✓ |

### ZW judgment calls

1. **Spotify 0.15 (between SA's 0.30 and NG's 0.10)** — reflects SADC spillover from SA without matching it. If you think Spotify in ZW is closer to NG-tier (smaller user base), drop to 0.12.
2. **Audiomack 0.15** — bumped because of the 2024 Warner-Audiomack catalog deal which specifically named Zimbabwe. If that deal hasn't translated to actual user adoption, drop to 0.10 and add 0.05 to Boomplay.
3. **Mdundo 0.05** — slightly elevated vs NG/GH because Mdundo's pan-African catalog rolls out to ZW. Could drop to 0.03.

---

## Ethiopia

### Data points pulled

| Source | Data point | Value |
|---|---|---|
| DataReportal Digital 2026 Ethiopia | Internet users (Oct 2025) | 29.5M (21.7% penetration) |
| DataReportal Digital 2026 Ethiopia | Social media user identities | 9.80M (7.2% pop) |
| DataReportal | Internet user growth 2024→25 | +1.6M (+5.9%) |
| Afrocritik | Universal-Sewasew Multimedia licensing deal | 2024 — local platform ROSTER doesn't track |
| Various qualitative | Ethiopian music = YouTube-dominant consumption | Amharic catalogs primarily on YouTube |
| Ethiopian Business Review | "TikTok phenomenon" rising in Ethiopia | recent |

### The market shape — and the big caveat

Ethiopia is **the most YouTube-dependent market in this batch by a wide margin**. Ethiopian music consumption flows through:

1. **YouTube** — dominant. Ethiopian artists publish music videos to YouTube as their primary distribution; consumption follows.
2. **Local platforms** — Sewasew Multimedia is the home-built service. Universal Music partnered with them in 2024. **We don't track Sewasew.**
3. **Pan-African DSPs** (Boomplay, Spotify, Audiomack) — present but with limited Amharic catalog penetration.

The honest read: any profile we ship for Ethiopia today **under-represents Sewasew** the same way the North African batch will under-represent Anghami. Recommend flagging this in the inline config comment so future-us knows the caveat.

### Proposed Ethiopia Reach weights

| Platform | Global default | **ET (proposed)** | Rationale |
|---|---:|---:|---|
| youtube | 0.20 | **0.30** | **Highest YouTube weight in any country profile** — reflects Ethiopia's documented YouTube-first music consumption |
| tiktok | 0.10 | **0.18** | Documented rising adoption ("TikTok phenomenon") |
| boomplay | 0.15 | **0.15** | Pan-African reach but limited Amharic catalog |
| spotify | 0.25 | **0.15** | Available since 2018; small Amharic catalog |
| audiomack | 0.10 | **0.08** | Limited Amharic catalog; less central than in West Africa |
| instagram | 0.05 | **0.07** | Marginal bump given social media growth |
| deezer | 0.10 | **0.04** | Negligible |
| mdundo | 0.05 | **0.03** | Negligible |
| **Sum** | **1.00** | **1.00** | ✓ |

### ET judgment calls

1. **YouTube at 0.30 (the single highest YouTube weight in any profile so far)** — driven by qualitative ground-truth that Ethiopian music is YouTube-distributed. If you think this overweights YouTube vs Boomplay's actual Ethiopian uptake, drop to 0.25 and bump Boomplay to 0.20.
2. **No Sewasew tracking** — biggest gap. Without it, this profile is genuinely incomplete for Ethiopian artists. Two options:
   - **Ship as drafted, flag caveat in comments** — works for now; revisit when we onboard an Ethiopian artist
   - **Add Sewasew to `lib/scoring/platforms.ts` first** — proper but requires a code change (1-2 hours of work) before this profile is meaningful
3. **Spotify 0.15 — same as ZW** — feels generous for Ethiopia given Amharic catalog limitations. Could drop to 0.12 and add to YouTube or TikTok.

---

## Cross-batch cumulative table (all 9 proposed countries)

| Platform | Global | SA | NG | GH | KE | TZ | UG | CI | SN | CM | **ZW** | **ET** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| spotify | 0.25 | 0.30 | 0.10 | 0.10 | 0.12 | 0.10 | 0.10 | 0.12 | 0.12 | 0.10 | **0.15** | **0.15** |
| youtube | 0.20 | 0.20 | 0.20 | 0.22 | 0.18 | 0.20 | 0.20 | 0.20 | 0.20 | 0.20 | **0.20** | **0.30** |
| audiomack | 0.10 | 0.07 | 0.30 | 0.28 | 0.07 | 0.05 | 0.07 | 0.10 | 0.12 | 0.18 | **0.15** | **0.08** |
| boomplay | 0.15 | 0.10 | 0.18 | 0.18 | 0.20 | 0.28 | 0.18 | 0.18 | 0.15 | 0.20 | **0.18** | **0.15** |
| tiktok | 0.10 | 0.20 | 0.15 | 0.15 | 0.15 | 0.15 | 0.20 | 0.15 | 0.18 | 0.15 | **0.15** | **0.18** |
| instagram | 0.05 | 0.07 | 0.05 | 0.05 | 0.05 | 0.05 | 0.05 | 0.05 | 0.05 | 0.05 | **0.05** | **0.07** |
| deezer | 0.10 | 0.04 | 0.01 | 0.01 | 0.03 | 0.02 | 0.05 | 0.18 | 0.15 | 0.10 | **0.07** | **0.04** |
| mdundo | 0.05 | 0.02 | 0.01 | 0.01 | 0.20 | 0.15 | 0.15 | 0.02 | 0.03 | 0.02 | **0.05** | **0.03** |

**Outlier check:**
- ET YouTube = 0.30 (matches SA Spotify as the single highest "platform of the country" so far). Consistent narrative.
- ZW Spotify = 0.15 (only mid-tier Spotify weight outside SA + the new ZW/ET). Reflects SADC spillover.
- All weights sum exactly to 1.0000.

---

## Sources

- [Digital 2025: Zimbabwe — DataReportal](https://datareportal.com/reports/digital-2025-zimbabwe)
- [38.4% of Zimbabweans Now Online, But Challenges Remain — Matebeleland Pulse](https://matebelelandpulse.co.zw/2025/03/11/zimbabwe-internet-social-media-report-2025/)
- [Warner Music and Audiomack expand licensing deal to more African countries — Techpoint Africa](https://techpoint.africa/news/warner-music-audiomack-expand-africa/)
- [Digital 2026: Ethiopia — DataReportal](https://datareportal.com/reports/digital-2026-ethiopia)
- [What Will Shape Africa's Music Landscape in 2024? — Afrocritik](https://www.afrocritik.com/what-will-shape-africas-music-landscape-in-2024/)
- [Ethiopians Getting Taste of TikTok Phenomenon — Ethiopian Business Review](https://ethiopianbusinessreview.net/ethiopians-getting-taste-of-tiktok-phenomenon/)

---

## Sign-off prompt

To accept both as-drafted: "Ship Batch 3 as drafted."

To accept with amendments: "Ship Batch 3 with these changes: [your edits]."

To reject: "Skip [country] for now — needs more research / needs [Sewasew/etc] integration first."

---

## Status of all 13 remaining countries

| Country | Status |
|---|---|
| ✅ South Africa | Shipped |
| ✅ Nigeria | Shipped |
| 📝 Ghana | Drafted (Batch 1) — awaiting sign-off |
| 📝 Kenya | Drafted (Batch 1) — awaiting sign-off |
| 📝 Tanzania | Drafted (Batch 1) — awaiting sign-off |
| 📝 Uganda | Drafted (Batch 1) — awaiting sign-off |
| 📝 Côte d'Ivoire | Drafted (Batch 2) — awaiting sign-off |
| 📝 Senegal | Drafted (Batch 2) — awaiting sign-off |
| 📝 Cameroon | Drafted (Batch 2) — awaiting sign-off |
| 📝 Zimbabwe | Drafted (Batch 3) — awaiting sign-off |
| 📝 Ethiopia | Drafted (Batch 3) — awaiting sign-off, **caveat: no Sewasew tracking** |
| ⏳ Egypt | Pending (Batch 4) — **needs Anghami in `platforms.ts` first** |
| ⏳ Morocco | Pending (Batch 4) — **needs Anghami** |
| ⏳ Algeria | Pending (Batch 4) — **needs Anghami** |
| ⏳ Tunisia | Pending (Batch 4) — **needs Anghami** |

**9 of 13 countries drafted and ready for review.** Only Batch 4 (4 North African countries) remains, and that batch is gated on the Anghami platform decision — recommend adding Anghami to `lib/scoring/platforms.ts` before we draft those four (matches the recommendation in `/docs/regional-weighting.md` § 7).
