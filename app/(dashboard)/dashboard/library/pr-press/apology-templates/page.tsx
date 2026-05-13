"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ResourcePage } from "@/components/library/module-shell";

const COLOR = "#F472B6";

interface Tpl { id: string; name: string; severity: "Minor / clarification" | "Mid / accountability" | "Major / serious"; channel: string; useWhen: string; body: string; }

const TEMPLATES: Tpl[] = [
  {
    id: "clarification",
    name: "Quick clarification (factual error / misquote)",
    severity: "Minor / clarification",
    channel: "Notes-app screenshot to social",
    useWhen: "A factual claim about you is circulating that's wrong but not malicious. No formal apology needed — just clear the air.",
    body: `Quick note —

There's a story circulating that I [briefly state what people are saying]. To clarify: [what actually happened in 1–2 sentences].

I appreciate the heads-up from the people who flagged it. Carrying on.

— [Artist]`,
  },
  {
    id: "missed-show",
    name: "Missed show / cancellation",
    severity: "Mid / accountability",
    channel: "Notes-app + email to ticket-holders",
    useWhen: "A show was cancelled / artist couldn't perform. Refund / make-up info required.",
    body: `Last night's show in [City] didn't happen, and that's on me.

[Brief, honest reason — illness, travel emergency, force majeure. Don't fabricate.]

For everyone who travelled, who waited, who made plans — I'm sorry. The promoter is processing full refunds, with details landing in your email by [date]. We are working on a make-up date and will announce within [timeframe].

Live shows are the contract I sign with the people who care about this music. I take it seriously, and I'll make it right.

— [Artist]`,
  },
  {
    id: "social-misstep",
    name: "Social-media misstep (off-brand post / poor judgement)",
    severity: "Mid / accountability",
    channel: "Same platform as the original post",
    useWhen: "Posted something that landed badly — tone-deaf joke, ill-timed promotion, comment that's been read as insensitive. Audience is upset; not yet sponsor / regulatory.",
    body: `Earlier I [described what I did]. I've taken it down.

In short: I read the room wrong. The post was [inappropriate / tone-deaf / poorly-timed], and the people I most respect in this audience told me as much. They were right.

I'm not asking for forgiveness — that's earned over time, not in a paragraph. I'm just acknowledging it directly so we can move on with clearer ears.

— [Artist]`,
  },
  {
    id: "behaviour-public",
    name: "Public behaviour (incident at venue / on-set / public altercation)",
    severity: "Major / serious",
    channel: "Press statement + on-camera (if appropriate)",
    useWhen: "An incident happened in public — physical, verbal, contractual. Witnesses, video, possibly press. Lawyer-reviewed required before posting.",
    body: `I am aware of the situation at [venue / location] on [date] and want to address it directly.

[1–2 sentences acknowledging what happened. Not denying the fact, not editorialising the intent. Stick to what's verified.]

Conduct in [public spaces / professional environments] should never look like that, and there is no version of [the situation] where my response was the right one. I'm sorry to [the affected parties — name them], to my team, to the people who saw it, and to the people who've stood by me through years of work.

Practically:
• [I have apologised to / will apologise to the affected parties privately.]
• [I am working with [therapist / advisor / coach] to make sure this doesn't repeat.]
• [I am taking a [day / week / month] off public schedule to focus on this.]

I will not be giving further interviews on this in the next [timeframe]. I'll let the work that follows do the talking.

— [Artist]`,
  },
  {
    id: "allegations",
    name: "Allegations against artist (legal / serious)",
    severity: "Major / serious",
    channel: "Lawyer-reviewed press statement only",
    useWhen: "Allegations of criminal, contractual, or seriously harmful conduct. ALWAYS through lawyer first. Statement is the absolute minimum — let formal process take over from here.",
    body: `[Artist] is aware of [the publication / the report / the allegations] published on [date].

[Artist] takes the issues raised seriously and is co-operating fully with [relevant process — investigation / inquiry / counsel]. Out of respect for that process and for the parties involved, [Artist] will not be commenting further at this time.

Press enquiries: [Press contact email]

— [Manager / legal counsel for Artist]

[NOTE: This template intentionally minimal. Substantive comment risks contaminating the legal process. ALWAYS use a lawyer before issuing any version of this. Do not delete posts, edit timelines, or pre-empt formal findings.]`,
  },
  {
    id: "team-member",
    name: "Conduct by team member or featured artist",
    severity: "Major / serious",
    channel: "Press statement",
    useWhen: "Someone in the artist's circle (band member, featured artist, producer, label exec) is in a crisis that touches the artist by association.",
    body: `We are aware of the recent reports concerning [person / role]. The situation is being addressed, and we are taking it seriously.

Effective immediately, [person / role] is [no longer involved with / paused from / no longer associated with] the [tour / album / project]. [Optional context if it improves clarity, never if it shifts blame.]

Our priority is the safety and well-being of the people most affected. Beyond that, we will not be commenting further while [investigation / process] is ongoing.

— [Artist / Manager]`,
  },
];

export default function ApologyTemplatesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (t: Tpl) => {
    try { await navigator.clipboard.writeText(t.body); setCopied(t.id); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  const sevColor = {
    "Minor / clarification": "#10B981",
    "Mid / accountability": "#F59E0B",
    "Major / serious": "#EF4444",
  };

  return (
    <ResourcePage
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color={COLOR}
      tag="PR · Apology"
      title="Apology Statement Templates"
      intro="Six pre-drafted apology statements organised by severity. Use as starting drafts only — every situation requires editing for the specifics. Major / legal cases ALWAYS via attorney before issuing."
      next={{ href: "/dashboard/library/pr-press/awards-tracker", label: "Awards Submission Tracker" }}
    >
      <div className="space-y-4">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <p className="font-bold text-sm text-text-primary mb-1">{t.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: sevColor[t.severity], backgroundColor: `${sevColor[t.severity]}15` }}>{t.severity}</span>
                  <span className="text-[10px] text-text-muted">{t.channel}</span>
                </div>
              </div>
              <button onClick={() => copy(t)} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
                {copied === t.id ? <Check size={12}/> : <Copy size={12}/>} {copied === t.id ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-3"><span className="font-semibold text-text-primary">Use when:</span> {t.useWhen}</p>
            <pre className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-sans bg-surface-2 rounded-lg p-3">{t.body}</pre>
          </div>
        ))}
      </div>
    </ResourcePage>
  );
}
