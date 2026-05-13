/**
 * POST /api/ai
 * ─────────────
 * Platform-wide AI endpoint for ROSTER.
 * All tools call this — they pass their tool ID, artist context, and tool-specific params.
 * The route selects the right system prompt and returns the generated content.
 *
 * Body:  { tool: string; artistContext: ArtistContext; params: Record<string, unknown> }
 * Reply: { result: string } | { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ArtistContext, formatContextForPrompt } from "@/lib/artist-context";
import { createClient } from "@/lib/supabase/server";
import { BudgetExhaustedError, withBudget } from "@/lib/ai/budget";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth — every AI call is per-user so we can attribute cost.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { tool, artistContext, params } = body as {
      tool: string;
      artistContext: ArtistContext;
      params: Record<string, unknown>;
    };

    if (!tool || !artistContext) {
      return NextResponse.json({ error: "Missing tool or artistContext" }, { status: 400 });
    }

    const { system, user: userPrompt, model, maxTokens } = buildPrompt(
      tool,
      artistContext,
      params
    );
    const chosenModel = model ?? "claude-haiku-4-5-20251001";

    // Budget-enforced call: checks quota → runs → logs cost.
    // BudgetExhaustedError surfaces as 429 below.
    const result = await withBudget(user.id, tool, async () => {
      const message = await client.messages.create({
        model: chosenModel,
        max_tokens: maxTokens ?? 1024,
        system,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      return {
        result: text,
        model: chosenModel,
        inputTokens: message.usage?.input_tokens ?? 0,
        outputTokens: message.usage?.output_tokens ?? 0,
      };
    });

    return NextResponse.json({ result });

  } catch (err: unknown) {
    if (err instanceof BudgetExhaustedError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "BUDGET_EXHAUSTED",
          resetAt: err.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }
    logger.error("[AI route error]", {}, err);
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Prompt builder — one entry per tool ─────────────────────────────────────

function buildPrompt(
  tool: string,
  ctx: ArtistContext,
  params: Record<string, unknown>
): { system: string; user: string; model?: string; maxTokens?: number } {

  const ctxBlock = formatContextForPrompt(ctx);

  switch (tool) {

    // ── Pitching Scripts ──────────────────────────────────────────────────────
    // Haiku per user decision (2026-04-26): 5× cheaper than Sonnet,
    // good enough for ~150-250 word pitch emails. Revisit if quality
    // complaints emerge.
    case "pitch-generate": {
      const { outreachType, outlet, contactName, contactFocus, additionalContext } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 1024,
        system: `You are a world-class music industry publicist and A&R consultant with 20 years of experience.
You write pitch emails that actually get replies — because they're specific, demonstrate genuine knowledge of the recipient, lead with real value, and make a single clear ask.
You never use generic language. You always reference the artist's real achievements and the recipient's known editorial or business focus.
Write in a confident, professional tone — warm but never sycophantic. Short paragraphs, no fluff.
The email should be 150–250 words for the body. Subject line should be sharp and specific.

Artist context:
${ctxBlock}`,
        user: `Write a personalised pitch email for the following outreach.

Outreach type: ${outreachType}
Recipient outlet/platform: ${outlet}
Contact name: ${contactName || "not specified"}
What they're known for / their editorial focus: ${contactFocus || "not specified"}
Additional context or specific ask: ${additionalContext || "none"}

Format your response exactly as:
SUBJECT: [your subject line here]

[email body here — 150–250 words, no headers, flowing prose]

Make it feel like it was written specifically for this recipient. Reference their actual editorial focus. Lead with the artist's most compelling fact. End with a single clear ask.`,
      };
    }

    // ── Viral Hooks ───────────────────────────────────────────────────────────
    case "hooks-generate": {
      const { contentType, platform, hookStructure, count } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 1500,
        system: `You are a viral content strategist who specialises in short-form music marketing for African and global markets.
You know what stops the scroll on TikTok, Instagram Reels, and YouTube Shorts.
You write hooks that sound like the artist — not like a marketing template.
You understand archetypes: a Street Poet sounds different from a Pop Architect. A Cultural Diplomat hooks differently from a Confessionalist.
Your hooks are specific, surprising, and authentic to the artist's voice.

Artist context:
${ctxBlock}`,
        user: `Generate ${count || 8} viral short-form hooks for ${ctx.artistName}.

Content type: ${contentType}
Platform: ${platform}
Hook structure preference: ${hookStructure || "mixed — use a variety"}

Return ONLY valid JSON. No markdown, no explanation before or after. Format:
[
  {
    "hook": "the opening line (max 15 words)",
    "structure": "question | pov | contrarian | confession | reveal | story | stat | list",
    "platform": "TikTok | Reels | Shorts | All",
    "score": 8,
    "why": "one sentence: why this specific hook works for this artist and their audience"
  }
]`,
      };
    }

    // ── YouTube Channel Audit ─────────────────────────────────────────────────
    // Haiku per user decision (2026-04-26). YouTube audits are the most
    // analytically demanding tool (channel diagnosis + 30-day plan), so
    // this is the most likely tool to surface a quality regression. Watch
    // for it; bump back to Sonnet for this one specifically if needed.
    case "youtube-audit": {
      const {
        channelName, subscriberCount, avgViews, topVideo,
        uploadFrequency, recentTitles, thumbnailStyle, monetised,
      } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 2000,
        system: `You are a YouTube growth strategist who specialises in music channels in Africa and global emerging markets.
You work with managers and labels — not creators. Your clients are smart operators who want specific, actionable intelligence.
You don't explain what YouTube is. You don't give beginner tips. You diagnose problems and prescribe specific fixes.
You benchmark against real performance standards for music channels at this artist's career stage and market.
Be direct. Be specific. Be useful.

Artist context:
${ctxBlock}`,
        user: `Audit this YouTube channel and give a performance diagnosis with specific action items.

Channel: ${channelName || ctx.artistName}
Subscribers: ${subscriberCount || "not provided"}
Average views per video: ${avgViews || "not provided"}
Top-performing video: ${topVideo || "not provided"}
Upload frequency: ${uploadFrequency || "not provided"}
Recent video titles (last 3–5): ${recentTitles || "not provided"}
Thumbnail style description: ${thumbnailStyle || "not provided"}
Monetised: ${monetised || "unknown"}

Provide your analysis in this exact format:

DIAGNOSIS
[2–3 sentences on the channel's current state and biggest growth gap]

CRITICAL FIXES (do these first)
1. [specific fix with expected impact]
2. [specific fix]
3. [specific fix]

TITLE INTELLIGENCE
[Analysis of their current titles with 3 specific rewrite examples showing before/after]

THUMBNAIL INTELLIGENCE
[Specific feedback on their thumbnail approach with 3 concrete improvements]

CONTENT STRATEGY
[2–3 specific content types that would perform for this artist in their market, with reasoning]

30-DAY ACTION PLAN
[Week by week, specific actions — not generic advice]`,
      };
    }

    // ── One-Sheet auto-fill ───────────────────────────────────────────────────
    case "onesheet-bio": {
      const { template, additionalNotes } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 600,
        system: `You write artist bios for one-sheets — the documents managers send to bookers, labels, and press.
A great one-sheet bio is 80–120 words. It leads with the most impressive fact, flows naturally, and makes you want to know more.
Write in third person. No clichés. No "up-and-coming." No "unique sound."
Match the tone to the artist's archetype.

Artist context:
${ctxBlock}`,
        user: `Write a one-sheet bio for ${ctx.artistName}.
Template style: ${template || "dark editorial"}
Additional notes from manager: ${additionalNotes || "none"}

Write exactly one bio (80–120 words). Third person. No headers or labels. Just the bio text.`,
      };
    }

    // ── Outreach Email — Phase 3 Tier A first surface ────────────────────────
    // Shorter than press pitches, more conversational. Used per-contact
    // throughout ROSTER (Industry Directory, future CRM, follow-ups).
    case "outreach-email": {
      const {
        contactName,
        contactRole,
        contactOrg,
        contactFocus,
        contactCountry,
        intent,
        ask,
        previousInteraction,
      } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 800,
        system: `You draft professional outreach emails on behalf of music managers.
Your emails are direct but warm, written in South African English (no over-Americanised tone), and concrete.
You make one clear ask per email. You sign off as the user (the manager), not as ROSTER. You don't use clichés, "I hope this finds you well", or "I wanted to reach out".
Match the recipient's seniority — formal for label A&R, conversational for indie venue bookers, peer-to-peer for fellow managers.

═══════════════════════════════════════════════════════════
ABSOLUTE RULE — NEVER FABRICATE NUMBERS
═══════════════════════════════════════════════════════════
You MUST NOT invent ANY numerical claim about the artist. This includes:
  • Stream counts, view counts, listener counts
  • Follower counts, subscriber counts
  • Time windows ("in six weeks", "in three months")
  • Growth rates, percentages, ranks, chart positions
  • Tour dates, ticket sales, audience sizes
  • Press features, playlist adds, radio plays

If the artist context above provides a specific verified number (e.g. "2.4M monthly Spotify listeners" in streamingNumbers), you may use that exact number verbatim.

If the artist context does NOT provide a number, and you would normally cite one to make the email concrete, insert a placeholder in this exact format:
  [insert your latest <metric>]

Example — instead of writing "His last three releases clocked 280K+ streams" (FABRICATION), write "His last three releases clocked [insert your latest 28-day stream count]".

The user will fill these placeholders before sending. A draft with placeholders is better than a draft with invented numbers — invented numbers can destroy a professional relationship if the recipient checks them.

Other concrete facts you CAN use without verification: the artist's name, genre, market, archetype, and brand voice (these come from the user's own Brand Book and are authoritative).
═══════════════════════════════════════════════════════════

Artist context:
${ctxBlock}`,
        user: `Draft an outreach email.

Recipient name: ${contactName || "not specified"}
Recipient role: ${contactRole || "not specified"}
Recipient org: ${contactOrg || "not specified"}
Recipient country: ${contactCountry || "not specified"}
Recipient editorial / business focus: ${contactFocus || "not specified"}

Intent: ${intent || "intro"}
The ask (one specific thing): ${ask || "not specified"}
Previous interaction with this person: ${previousInteraction || "no prior contact"}

Format your response exactly as:
SUBJECT: [your subject line — 6–10 words, specific. Avoid numbers in the subject unless they came from the verified Artist context above.]

[email body — 100–180 words, no greetings ceremony if intro is "follow-up"; flowing prose; one ask in the closing paragraph. Use [insert your latest …] placeholders for any number not in the verified Artist context.]`,
      };
    }

    // ── Posting Checklist — AI caption writer ────────────────────────────────
    case "caption-generate": {
      const { platform, contentDescription, tone } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 400,
        system: `You write social media captions for music artists. Short, punchy, platform-native.
You match the artist's brand voice. You don't sound like a brand. You sound like the artist.
You know what performs on each platform — Instagram wants depth, TikTok wants personality, Twitter/X wants wit.

Artist context:
${ctxBlock}`,
        user: `Write 3 caption options for this post.

Platform: ${platform}
What the post shows/is about: ${contentDescription}
Tone requested: ${tone || "match the artist's natural voice"}

Return as JSON:
[
  { "caption": "...", "tone": "...", "hashtags": ["tag1", "tag2"] },
  { "caption": "...", "tone": "...", "hashtags": ["tag1", "tag2"] },
  { "caption": "...", "tone": "...", "hashtags": ["tag1", "tag2"] }
]`,
      };
    }

    // ── Sync Pitch Drafter (Phase 3 Tier A — Sync module) ──────────────────
    case "sync-pitch-draft": {
      const { supervisorName, agency, project, projectType, songTitle, songMood, brief } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 700,
        system: `You draft sync pitch emails on behalf of music managers / publishers.
Sync supervisors get hundreds of pitches a week. Yours has to do three things in 90 seconds of reading:
  1. Reference the supervisor's actual show / project briefly so they know it's not a blast
  2. Lead with ONE concrete reason this song fits their brief
  3. Make access easy — links to private streaming, one-sheet, splits

Tone: peer-to-peer, professional, no fluff, no "I hope this finds you well".

═════════════════════════════════════════════
ABSOLUTE RULE — NEVER FABRICATE NUMBERS OR CREDITS
═════════════════════════════════════════════
Same rule as outreach-email — only use verified numbers from the Artist context. Otherwise use placeholders like [insert your latest 28-day stream count]. Never invent past sync placements.

Artist context:
${ctxBlock}`,
        user: `Draft a sync pitch email.

Recipient: ${supervisorName || "[Music Supervisor]"}
Agency: ${agency || "not specified"}
Project / show: ${project || "not specified"}
Project type: ${projectType || "TV episodic"}

Song being pitched: ${songTitle || "not specified"}
Mood / fit angle: ${songMood || "not specified"}
Brief context (what they asked for): ${brief || "no brief — speculative pitch"}

Format:
SUBJECT: [short, 6–10 words, song name in subject]

[email body — 100–160 words, flowing prose. End with: link to private stream + one-sheet + clearance status. One ask: "open to a quote?" or "shall I send the master?".]`,
      };
    }

    // ── WhatsApp Drafter (Phase 3 Tier A Wave 2) ────────────────────────────
    case "whatsapp-draft": {
      const { recipientName, recipientRole, intent, previousMessage, ask } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 400,
        system: `You draft WhatsApp messages on behalf of music managers in South Africa and Nigeria.
WhatsApp is the dominant business channel here — messages should be conversational, fast, mobile-friendly.
Rules:
  • Short — typically 30–80 words, never a wall of text
  • South African / Nigerian English, no Americanisms
  • Address by first name, no salutation theatre ("Dear Sir / Madam")
  • One clear ask per message
  • If reminding, reference the previous thread without re-explaining
  • No fabricated numbers (same rule as email)

Artist context:
${ctxBlock}`,
        user: `Draft a WhatsApp message.

Recipient: ${recipientName || "not specified"}
Recipient role: ${recipientRole || "not specified"}
Intent: ${intent || "follow-up"}
Previous message context: ${previousMessage || "no prior messages"}
The ask: ${ask || "not specified"}

Output: just the message body. No preamble. Use line breaks where natural for readability on mobile.`,
      };
    }

    // ── Press Release Drafter (Phase 3 Tier A Wave 2) ───────────────────────
    case "press-release-draft": {
      const { releaseType, headline, keyFacts, quote, embargo } = params as Record<string, string>;
      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 1200,
        system: `You write professional music press releases. Same conventions across SA / NG / global press circuits.
Structure:
  • FOR IMMEDIATE RELEASE (or embargo line) — top of doc
  • Headline (15 words max, sharp)
  • Dateline (CITY — Date)
  • Lede (one sentence: who, what, when, why-it-matters)
  • Body (2–3 short paragraphs: detail, quote, momentum)
  • Quote (attributed)
  • About paragraph (60–90 words on the artist)
  • Press contact

═════════════════════════════════════════════
ABSOLUTE RULE — NEVER FABRICATE NUMBERS
═════════════════════════════════════════════
Same rule as outreach-email. Use [insert your latest …] placeholders for any number not in the verified Artist context. Press releases circulate widely — fabrications get caught.

Artist context:
${ctxBlock}`,
        user: `Draft a press release.

Release type: ${releaseType || "single drop"}
Headline guidance: ${headline || "let me suggest"}
Key facts (bullet list from the manager): ${keyFacts || "none provided"}
Quote (attributed to artist or manager): ${quote || "draft a placeholder quote in the artist's voice"}
Embargo: ${embargo || "FOR IMMEDIATE RELEASE"}

Output the full press release as plain text, ready to copy.`,
      };
    }

    // ── ROSTER Score Diagnosis ───────────────────────────────────────────────
    // Generates a 1-sentence plain-English summary of an artist's current
    // ROSTER score profile — shown as a micro-label below their genre
    // on the ArtistRow. Cached 24h client-side so it fires rarely.
    case "score-diagnosis": {
      const {
        reach, momentum, engagement,
        reachSignals, momentumSignals, engagementSignals,
        platformCount,
        topReachSignals, topEngagementSignals,
      } = params as {
        reach: number;
        momentum: number;
        engagement: number;
        reachSignals: number;
        momentumSignals: number;
        engagementSignals: number;
        platformCount: number;
        topReachSignals: Array<{ signal: string; contribution: number }>;
        topEngagementSignals: Array<{ signal: string; contribution: number }>;
      };

      const reachTop = (topReachSignals ?? []).slice(0, 2)
        .map((s) => s.signal.replace(".", " "))
        .join(", ");
      const engTop = (topEngagementSignals ?? []).slice(0, 2)
        .map((s) => s.signal.replace(".", " "))
        .join(", ");

      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 60,
        system: `You write 1-sentence artist score diagnoses for a music management platform.
Rules:
  • Exactly ONE sentence. No full stop at the end. Max 12 words.
  • No hedging ("seems like", "appears to be"). Be direct and specific.
  • Use plain English — no jargon like "log-normalized" or "velocity signals".
  • Focus on what's most notable: is reach strong but engagement thin? Is momentum spiking? Is the dataset sparse?
  • Never mention the score numbers themselves — describe the pattern in words.
  • Write as if you're telling a manager what they should know at a glance.`,
        user: `Artist: ${ctx.artistName || "Unknown"}
Genre: ${ctx.genre || "Unknown"}
Scores: Reach ${reach} · Momentum ${momentum > 0 ? "+" : ""}${momentum} · Engagement ${engagement}
Data coverage: ${platformCount} platform${platformCount === 1 ? "" : "s"}, ${reachSignals} reach signals, ${momentumSignals} momentum signals, ${engagementSignals} engagement signals
Top reach drivers: ${reachTop || "none"}
Top engagement drivers: ${engTop || "none"}

Write a 1-sentence diagnosis (max 12 words, no full stop).`,
      };
    }


    // ── Release Plan — AI Task Generation ───────────────────────────────────
    // Generates a tailored, territory-aware release plan as a JSON array of
    // tasks. Called when the user clicks "Generate with ROSTER AI" on the
    // plan board. Returns raw JSON only — no markdown wrapper.
    case "release-plan-generate": {
      const {
        releaseTitle, releaseType, releaseDate, daysUntil,
        dsps, distributor, country, artistName,
      } = params as {
        releaseTitle: string;
        releaseType: string;
        releaseDate: string | null;
        daysUntil: string;
        dsps: string[];
        distributor: string | null;
        country: string | null;
        artistName: string;
      };

      const dspList = (dsps ?? []).join(", ") || "major DSPs";
      const distLabel = distributor ?? "independent distribution";
      const territoryNote = country
        ? `Primary territory: ${country}. Include platform-specific steps for leading DSPs in this market.`
        : "Pan-African / global release.";

      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 2000,
        system: `You are ROSTER AI — a music business intelligence system for independent African music managers.
You generate highly specific, actionable release plan tasks. You know the African music ecosystem deeply: Boomplay, Audiomack, SoundCloud, Afrobeats radio circuits, WhatsApp fan marketing, SAMRO/RISA/CAPASSO processes, Africori/Amuse/FUGA distribution workflows.

OUTPUT RULES — critical:
• Return ONLY a valid JSON array. No markdown, no explanation, no wrapper.
• Each item: { "phase": string, "text": string, "priority": "critical"|"high"|"medium"|"low" }
• Valid phases: pre_8w | pre_6w | pre_4w | pre_2w | pre_1w | release | post_1w | post_1m
• Generate 5-7 tasks per phase (8 phases = ~48 tasks total).
• Tasks must be specific to THIS release — mention the DSPs, distributor, territory, and release type by name.
• No generic filler. Every task must be something the manager actually needs to do for this specific release.`,
        user: `Release: "${releaseTitle}" by ${artistName}
Type: ${releaseType}
Street date: ${releaseDate ?? "TBC"} (${daysUntil} from today)
DSPs: ${dspList}
Distributor: ${distLabel}
${territoryNote}

Generate the full release plan JSON array now.`,
      };
    }

    // ── Release Plan — Strategic Brief ───────────────────────────────────────
    // Returns a 3-4 sentence strategic brief shown at the top of the plan
    // board. Opinionated, specific to the release, no bullet points.
    case "release-plan-strategy": {
      const {
        releaseTitle, releaseType, releaseDate, daysUntil,
        dsps, distributor, country, artistName,
      } = params as {
        releaseTitle: string;
        releaseType: string;
        releaseDate: string | null;
        daysUntil: string;
        dsps: string[];
        distributor: string | null;
        country: string | null;
        artistName: string;
      };

      const dspList = (dsps ?? []).join(", ") || "major DSPs";
      const distLabel = distributor ?? "independent distribution";

      return {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 300,
        system: `You are ROSTER AI — a music business intelligence system for independent African music managers.
Write a direct, opinionated strategic brief for a release.
Rules:
• 3-4 sentences only. No bullet points. No headers.
• Be specific: reference the actual DSPs, territory, release type, and timing.
• Lead with the single most important strategic priority for this release.
• Mention one key risk and how to mitigate it.
• Tone: confident senior manager advising a peer — direct, no hedging.`,
        user: `Release: "${releaseTitle}" by ${artistName}
Type: ${releaseType}
Street date: ${releaseDate ?? "TBC"} (${daysUntil} from today)
DSPs: ${dspList}
Distributor: ${distLabel}
Territory: ${country ?? "Pan-African / global"}

Write the strategic brief.`,
      };
    }

    default:
      return {
        system: "You are a helpful music business assistant.",
        user: `Tool: ${tool}\nParams: ${JSON.stringify(params)}`,
      };
  }
}
