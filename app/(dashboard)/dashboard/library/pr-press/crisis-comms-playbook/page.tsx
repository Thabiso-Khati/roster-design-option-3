"use client";
import { ResourcePage } from "@/components/library/module-shell";

const COLOR = "#F472B6";

interface Step { title: string; body: string; }
interface Phase { name: string; window: string; steps: Step[]; }

const PHASES: Phase[] = [
  {
    name: "Phase 1 — First hour",
    window: "0–60 minutes from awareness",
    steps: [
      { title: "Acknowledge internally — do not post yet", body: "Manager + artist + lawyer + PR are on a single signal / WhatsApp thread within 15 minutes. Confirm: what happened, what's verified, what's rumour, what's exposed publicly." },
      { title: "Lock the platforms", body: "Pause scheduled releases, scheduled social posts, and any sponsored content auto-publishing. Switch incoming DM filters to manager-monitored inbox." },
      { title: "Assess the magnitude", body: "Severity scale: (1) social rumour with no traction (monitor only); (2) verified mid-tier blog (statement within 6 hours); (3) major outlet picking it up (statement within 2 hours); (4) viral / TikTok-led / sponsor-impacting (statement within 60 minutes)." },
      { title: "Identify the audience", body: "Are we addressing fans, sponsors, label, regulators, or general public? The audience determines the channel: fans = artist's direct social; sponsors = private call + email; press = formal statement." },
      { title: "Decide on counsel", body: "If the issue is legal (allegations of crime, contract dispute, defamation by a third party), no statement before lawyer review. Other issues can be addressed faster but always with PR review." },
    ],
  },
  {
    name: "Phase 2 — Initial response",
    window: "1–6 hours from awareness",
    steps: [
      { title: "Draft the statement", body: "Use the Apology Statement Templates as starting point. The first statement is short — acknowledge, address one concrete fact, commit to a follow-up, sign off. Avoid passive language ('mistakes were made'). Avoid combative language ('the truth will come out')." },
      { title: "Get sign-off", body: "Artist signs (or explicit verbal approval recorded). Manager + lawyer + PR sign. Do not skip any of the three. The statement goes nowhere without all three signs." },
      { title: "Choose the platform", body: "Match channel to severity: notes-app screenshot for fan-facing; press release for industry; on-camera video for face-required moments; private email for sponsors / partners. Don't over-deliver — a video isn't always needed." },
      { title: "Post + monitor", body: "Post the statement. Within 5 minutes of posting, monitor: comments velocity, share velocity, sentiment direction, journalist enquiries. If sentiment is sharply negative within 30 minutes, prepare a follow-up; do not delete the original." },
      { title: "Notify affected parties", body: "If the issue affects ticket-holders, sponsors, fans on the list, label or distributor partners — notify them privately + before / alongside public statement. Surprise damages relationships." },
    ],
  },
  {
    name: "Phase 3 — Sustained response",
    window: "6–48 hours from awareness",
    steps: [
      { title: "Address legitimate questions", body: "Identify the 5 most common questions in the comment thread. Address them in a follow-up post if substantive. Ignore bad-faith trolling." },
      { title: "Demonstrate action, not just words", body: "If an apology is involved, the second post (24–36 hours later) should describe the concrete action being taken — donation, training, rule change, third-party review. 'Sorry' alone is insufficient for sustained-news cycles." },
      { title: "Hold press one-on-ones (if appropriate)", body: "For substantive cases, a 30-minute call with one trusted journalist (not a press conference) typically resets the narrative. Give them something exclusive — a fact, a context, a pivot." },
      { title: "Pull back marketing", body: "Pause unrelated marketing campaigns for 48-72 hours. Continuing to push 'pre-save the new single!' while the crisis is unfolding reads as tone-deaf." },
      { title: "Maintain the team channel", body: "Single coordination thread stays active until the issue is fully behind you. Don't rotate spokespersons mid-crisis — single voice avoids contradictions." },
    ],
  },
  {
    name: "Phase 4 — Recovery",
    window: "Day 3–14",
    steps: [
      { title: "Return to programming, gradually", body: "Resume marketing on day 3-5 with non-promotional content (BTS, fan-engagement, music posts). Resume full marketing on day 7-14 once sentiment has stabilised." },
      { title: "Public follow-up if action was promised", body: "Where you committed to action (donation, training, etc.) — publicly demonstrate it within 14-21 days. Receipts. Photos. Third-party confirmation. Not delivering kills future credibility." },
      { title: "Internal post-mortem", body: "Within 7-14 days: meeting between manager / artist / lawyer / PR. Document what happened, what we did right, what we did slowly, what we missed. Update the playbook with learnings." },
      { title: "SEO / search clean-up", body: "Submit corrections to inaccurate articles. Engage SEO consultant (if budget) to push down outdated negative search results. Don't try to scrub legitimate negative coverage — it amplifies the Streisand effect." },
      { title: "Sponsor / partnership recovery", body: "Where sponsors paused, restart conversations 14-30 days post-crisis. Show data — sentiment recovered, audience retained, demonstrated action. Don't beg; lead with confidence and the longer arc." },
    ],
  },
  {
    name: "Phase 5 — Audit & prevent",
    window: "Day 30+",
    steps: [
      { title: "Update the playbook", body: "Document what you learned in this playbook so the next crisis (and there will be one) has a faster, sharper response." },
      { title: "Audit the team", body: "Did the chain of command work? Did the right people make the call quickly? If anyone froze, identify the training gap." },
      { title: "Pre-write 'what if' statements", body: "For known risk areas (lyrical content, past behaviour resurfacing, family / partner controversies, IP disputes) — pre-draft holding statements. The 60-second response is impossible without prep." },
      { title: "Insurance review", body: "If the crisis cost real money (cancelled shows, lost sponsors), check media-liability and reputation insurance. Some policies cover crisis-PR firm fees." },
      { title: "Mental-health support", body: "Crisis is brutal on the artist personally. Ensure mental health support is offered (therapist / coach). Career protection without personal protection is incomplete." },
    ],
  },
];

export default function CrisisCommsPlaybookPage() {
  return (
    <ResourcePage
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color={COLOR}
      tag="PR · Crisis"
      title="Crisis Comms Playbook"
      intro="The 5-phase response framework. Read it in calm. Use it in chaos."
      next={{ href: "/dashboard/library/pr-press/apology-templates", label: "Apology Statement Templates" }}
    >
      <div className="space-y-6">
        {PHASES.map((p, i) => (
          <div key={p.name} className="glass-card rounded-2xl p-6" style={{ borderColor: `${COLOR}20` }}>
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR }}>{p.name}</p>
                <p className="text-xs text-text-muted mt-1">{p.window}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ color: COLOR, backgroundColor: `${COLOR}15` }}>{i + 1} of {PHASES.length}</span>
            </div>
            <div className="space-y-3">
              {p.steps.map((s, j) => (
                <div key={j} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mt-0.5" style={{ backgroundColor: `${COLOR}20`, color: COLOR }}>{j + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-text-primary mb-1">{s.title}</p>
                    <p className="text-xs text-text-muted leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3" style={{ borderColor: `${COLOR}20`, backgroundColor: `${COLOR}08` }}>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Pair with.</span> The Apology Statement Templates (when an apology is the right move) and the Quotes Library (for press one-on-ones). Pre-draft holding statements for known-risk topics during calm periods — it's the single biggest determinant of a fast response.
        </p>
      </div>
    </ResourcePage>
  );
}
