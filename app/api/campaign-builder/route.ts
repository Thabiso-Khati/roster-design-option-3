export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/campaign-builder
// GET  — list the user's Campaign Builder campaigns
// POST — create a new campaign, generate the AI plan, save + return
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60; // AI generation can take up to 30s

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Types ─────────────────────────────────────────────────────
interface ContextSnapshot {
  artist_name: string | null;
  monthly_listeners: number;
  followers: number;
  compass_score: number;
  momentum: "up" | "flat" | "down";
  reach_tier: "micro" | "emerging" | "established";
  fan_crm_count: number;
  wa_count: number;
  release_date: string | null;
  release_title: string | null;
  days_to_release: number | null;
}

// ── GET — list campaigns ──────────────────────────────────────
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("artist_campaigns")
    .select(`id, title, goal, budget_zar, markets, status, created_at,
             context_snapshot->>release_title as release_title,
             context_snapshot->>days_to_release as days_to_release`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

// ── POST — create + generate campaign ─────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title?: string;
    goal?: string;
    budget_zar?: number;
    markets?: string[];
    story?: string;
    assets_in_hand?: string;
    creative_vision?: string;
    context_snapshot?: ContextSnapshot;
  };

  // Validate
  const validGoals = ["streams", "tickets", "awareness", "merch"];
  if (!body.title?.trim())         return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!validGoals.includes(body.goal ?? ""))
    return NextResponse.json({ error: "goal must be streams | tickets | awareness | merch" }, { status: 400 });
  if (!body.budget_zar || body.budget_zar < 500)
    return NextResponse.json({ error: "budget_zar must be at least 500" }, { status: 400 });
  if (!body.markets?.length)       return NextResponse.json({ error: "at least one market required" }, { status: 400 });

  const ctx: ContextSnapshot = body.context_snapshot ?? {
    artist_name: null, monthly_listeners: 0, followers: 0,
    compass_score: 0, momentum: "flat", reach_tier: "micro",
    fan_crm_count: 0, wa_count: 0,
    release_date: null, release_title: null, days_to_release: null,
  };

  const admin = createAdminClient();

  // ── 1. Insert campaign row (status = generating) ──────────────
  const { data: campaign, error: insertErr } = await admin
    .from("artist_campaigns")
    .insert({
      user_id:          user.id,
      title:            body.title.trim(),
      context_snapshot: ctx,
      goal:             body.goal,
      budget_zar:       body.budget_zar,
      markets:          body.markets,
      story:            body.story?.trim() || null,
      assets_in_hand:   body.assets_in_hand?.trim() || null,
      creative_vision:  body.creative_vision?.trim() || null,
      status:           "generating",
    })
    .select()
    .single();

  if (insertErr || !campaign) {
    return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // ── 2. Build AI prompt ────────────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userPrompt   = buildUserPrompt(ctx, body);

  // ── 3. Call Claude ────────────────────────────────────────────
  let planJson: Record<string, unknown> | null = null;
  let rawText = "";

  // -- 3a. Call Claude
  try {
    const msg = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });
    rawText = msg.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");
    console.log("[campaign-builder] AI response length:", rawText.length);
  } catch (apiErr) {
    const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
    console.error("[campaign-builder] Anthropic API error:", errMsg);
    await admin.from("artist_campaigns").update({ status: "draft" }).eq("id", campaign.id);
    return NextResponse.json(
      { error: `AI API error: ${errMsg}`, campaign_id: campaign.id },
      { status: 500 }
    );
  }

  // -- 3b. Parse JSON from response
  try {
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = fenceMatch
      ? fenceMatch[1]
      : (rawText.match(/\{[\s\S]*\}/) ?? [""])[0];
    if (!jsonStr.trim()) throw new Error("Empty JSON from AI response");
    planJson = JSON.parse(jsonStr.trim());
  } catch (parseErr) {
    const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error("[campaign-builder] JSON parse error:", errMsg);
    console.error("[campaign-builder] Raw text sample:", rawText.slice(0, 400));
    await admin.from("artist_campaigns").update({ status: "draft" }).eq("id", campaign.id);
    return NextResponse.json(
      { error: `JSON parse error: ${errMsg}`, campaign_id: campaign.id },
      { status: 500 }
    );
  }

  // ── 4. Save plan + mark ready ─────────────────────────────────
  const { data: updated, error: updateErr } = await admin
    .from("artist_campaigns")
    .update({ plan: planJson, status: "ready" })
    .eq("id", campaign.id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // -- 5. Auto-save to Workspace (non-fatal)
  try {
    const supabase = await createClient();
    await supabase.from("workspace_documents").insert({
      user_id:          user.id,
      title:            updated!.title,
      doc_type:         "campaign_plan",
      source_type:      "artist_campaigns",
      source_id:        updated!.id,
      content:          planJson as Record<string, unknown>,
      privacy:          "private",
      extraction_status: "not_applicable",
    });
  } catch (wsErr) {
    console.warn("[campaign-builder] Workspace save skipped:", wsErr);
  }

  return NextResponse.json({ campaign: updated }, { status: 201 });
}

// ── Prompt builders ───────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are ROSTER's Campaign Builder AI — a specialist in African music marketing strategy.

Your job is to produce a personalised, actionable campaign plan for an African independent artist.
You are NOT a generic marketing chatbot. You know African music platforms (Boomplay, Audiomack),
African media markets (SA radio, Nigerian social, Kenyan OOH), and African artist economics.

You ALWAYS output valid JSON in the exact schema specified. No prose outside the JSON block.
You ground every recommendation in the artist's actual data, not generic percentages.
You incorporate the artist's own story and creative vision into the plan — that is what creates texture.
You cite realistic African market rates. You flag risks directly.

Output ONLY a JSON code block with this exact structure:
\`\`\`json
{
  "headline": "One punchy sentence that captures the campaign's strategic thesis",
  "campaign_window": { "total_weeks": 10, "pre_release_weeks": 6, "post_release_weeks": 4 },
  "budget_summary": {
    "total_zar": 0,
    "paid_total_zar": 0,
    "owned_savings_zar": 0
  },
  "budget_allocation": [
    {
      "channel": "Channel name",
      "category": "paid_social | radio | ooh | pr | influencer | dsp | playlist | content",
      "spend_zar": 0,
      "pct_of_budget": 0,
      "what_it_buys": "Specific outcome with numbers if possible",
      "timing_label": "e.g. Week -4 to Week +1",
      "peak_week": -1,
      "rate_context": "Specific rate data for this market",
      "is_owned": false
    }
  ],
  "owned_media": [
    {
      "channel": "WhatsApp CRM | Email | Social organic",
      "asset_description": "What the artist has",
      "action": "What to do with it",
      "est_opens_or_reach": 0,
      "messaging_plan": "Suggested sequence",
      "cost_zar": 0
    }
  ],
  "timeline": [
    { "week": -6, "label": "6 weeks out", "activities": ["activity 1", "activity 2"] }
  ],
  "key_insight": "One strategic observation specific to this artist's exact situation",
  "risk_flags": ["Specific risk 1", "Specific risk 2"]
}
\`\`\``;
}

function buildUserPrompt(
  ctx: ContextSnapshot,
  body: {
    goal?: string;
    budget_zar?: number;
    markets?: string[];
    story?: string;
    assets_in_hand?: string;
    creative_vision?: string;
    title?: string;
  }
): string {
  const goalLabels: Record<string, string> = {
    streams:   "DSP/Streaming performance (grow monthly listeners, playlist placement, Spotify algorithmic push)",
    tickets:   "Ticket sales (drive attendance to a specific show or tour)",
    awareness: "Brand awareness / general profile building (press, editorial, wider discovery)",
    merch:     "Merchandise or product launch (drive e-commerce conversions)",
  };

  const marketNames: Record<string, string> = {
    ZA: "South Africa", NG: "Nigeria", KE: "Kenya",
    GH: "Ghana", UK: "United Kingdom", US: "United States",
  };

  const marketsStr = (body.markets ?? [])
    .map(m => marketNames[m] ?? m)
    .join(", ");

  const releaseStr = ctx.release_date
    ? `Release "${ctx.release_title ?? "upcoming release"}" in ${ctx.days_to_release} days (${ctx.release_date})`
    : "No release date set in ROSTER yet";

  const reachDesc: Record<string, string> = {
    micro:       "micro artist (under 10k monthly listeners) — grassroots, community-driven tactics work best",
    emerging:    "emerging artist (10k–100k monthly listeners) — ready to scale; right mix of organic + paid",
    established: "established artist (100k+ monthly listeners) — invest confidently in mass-market channels",
  };

  return `Build a personalised campaign plan for this artist.

=== ARTIST CONTEXT (pre-loaded from ROSTER) ===
Artist: ${ctx.artist_name ?? "Unknown"}
Reach tier: ${reachDesc[ctx.reach_tier]}
Monthly Spotify listeners: ${ctx.monthly_listeners.toLocaleString()}
Followers: ${ctx.followers.toLocaleString()}
Compass score: ${ctx.compass_score}/100
Momentum: ${ctx.momentum}
Fan CRM: ${ctx.fan_crm_count} total contacts, ${ctx.wa_count} with WhatsApp (zero-cost broadcast channel)
${releaseStr}

=== CAMPAIGN DECLARATION ===
Campaign title: ${body.title}
Primary goal: ${goalLabels[body.goal ?? "streams"] ?? body.goal}
Budget: R${(body.budget_zar ?? 0).toLocaleString()} ZAR
Target markets: ${marketsStr}

=== THE ARTIST'S STORY (their voice — this is what creates texture) ===
What this release is about:
${body.story?.trim() || "Not provided — build plan from numbers only."}

What they already have in their hands:
${body.assets_in_hand?.trim() || "None specified."}

Their own campaign ideas and creative vision:
${body.creative_vision?.trim() || "None specified."}

=== INSTRUCTIONS ===
1. Weight the budget toward the PRIMARY GOAL — streams = DSP/playlist/TikTok; tickets = geo-targeted OOH/radio in specific cities; awareness = PR/editorial; merch = Meta retargeting/social.
2. If wa_count > 0: include WhatsApp CRM as an owned_media item (zero cost). Reduce paid social recommendation accordingly.
3. Use REALISTIC African market rates: SA TikTok CPM R25–45, SA Meta CPM R30–60, SA 5FM/Metro FM radio plug R8k–R25k/month, SA Highveld/947 R12k–R35k/month, JCDecaux Sandton R18k–R45k/month, SA music PR retainer R8k–R20k/month, SA micro-influencer (10k–50k) R500–R3k per post, SA mid-tier influencer (50k–200k) R3k–R15k per post.
4. Set the timeline based on the release date (if provided). Standard arc: playlist pitching at week -6, PR outreach at week -5, radio plugging at week -4, influencer seeding at week -2, paid social peak at week -1 to 0, post-release maintenance weeks +1 to +4.
5. Incorporate the artist's story: the campaign narrative should reflect their actual release story, not generic language.
6. Surface RISK FLAGS: tight timelines (playlist editorial needs 7+ days), low budget vs ambitious goal, single-market concentration, missing owned media.
7. key_insight must be SPECIFIC to this artist's situation — not generic advice.

Output the JSON plan now.`;
}
