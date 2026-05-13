"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ResourcePage } from "@/components/library/module-shell";

const COLOR = "#EF4444";

interface Tpl { id: string; name: string; channel: "SMS" | "WhatsApp"; segment: string; body: string; chars: number; }

const TEMPLATES: Tpl[] = [
  {
    id: "drop-day",
    name: "Drop day announcement",
    channel: "WhatsApp",
    segment: "All subscribers",
    body: "[Artist] just dropped [Song]. Listen + share if you're feeling it: [link] 🔥",
    chars: 0,
  },
  {
    id: "presave",
    name: "Pre-save reminder",
    channel: "WhatsApp",
    segment: "Pre-savers + non-pre-savers",
    body: "Heads up — [Song] drops on [Date]. Pre-save here so it lands in your library the second it's out: [link]",
    chars: 0,
  },
  {
    id: "tour-presale",
    name: "Tour presale (VIP)",
    channel: "WhatsApp",
    segment: "VIP / paid tier",
    body: "VIP first dibs. Tickets to [Tour Name] open to you tomorrow at 9am SAST — 24 hours before public. Use code: [CODE]. Link drops in your email at 8:55am.",
    chars: 0,
  },
  {
    id: "tour-public",
    name: "Tour public on-sale",
    channel: "WhatsApp",
    segment: "All",
    body: "[Artist] tour tickets are LIVE. [N] cities, [Date range]. Grab: [link]",
    chars: 0,
  },
  {
    id: "merch-drop",
    name: "Merch drop",
    channel: "WhatsApp",
    segment: "All",
    body: "Limited [Item] live at [time]. List members get 24-hour head start. Shop: [link]",
    chars: 0,
  },
  {
    id: "show-reminder",
    name: "Show reminder (day-of)",
    channel: "WhatsApp",
    segment: "Tickets purchased",
    body: "Tonight, [City]. Doors [time]. Set [time]. Bring ID + ticket. See you there 🎤",
    chars: 0,
  },
  {
    id: "thank-you",
    name: "Post-show thank you",
    channel: "WhatsApp",
    segment: "Show attendees",
    body: "Thank you, [City]. Best night of the tour. Photos and the live cut hit your email later this week.",
    chars: 0,
  },
  {
    id: "sms-drop",
    name: "SMS drop alert (under 160 chars)",
    channel: "SMS",
    segment: "All",
    body: "[Artist]: [Song] is OUT. Listen: [link] STOP to opt out.",
    chars: 0,
  },
  {
    id: "sms-tour",
    name: "SMS tour on-sale (under 160)",
    channel: "SMS",
    segment: "All",
    body: "[Artist] tour LIVE: [link]. STOP to opt out.",
    chars: 0,
  },
  {
    id: "fan-survey",
    name: "Fan survey",
    channel: "WhatsApp",
    segment: "Engaged listeners",
    body: "60-second favour: tell me what you want next from [Artist]. New EP / live cuts / collab? Reply 1, 2 or 3 — I read every reply 🙏",
    chars: 0,
  },
];

export default function SMSWhatsAppTemplatesPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (t: Tpl) => { try { await navigator.clipboard.writeText(t.body); setCopied(t.id); setTimeout(() => setCopied(null), 1500); } catch {} };

  return (
    <ResourcePage
      parentHref="/dashboard/library/fan-crm"
      parentLabel="Back to Fan, CRM and Audience"
      color={COLOR}
      tag="CRM · Templates"
      title="SMS / WhatsApp Broadcast Templates"
      intro="WhatsApp + SMS templates ready for Africa's Talking, Twilio, or any broadcast tool. Copy, replace [bracketed] fields, send."
      next={{ href: "/dashboard/library/fan-crm/ai-whatsapp-drafter", label: "AI WhatsApp Drafter" }}
    >
      <div className="space-y-3">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <p className="font-bold text-sm text-text-primary">{t.name}</p>
                <p className="text-xs text-text-muted">{t.channel} · {t.segment} · {t.body.length} chars</p>
              </div>
              <button onClick={() => copy(t)} className="text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${COLOR}15`, color: COLOR }}>
                {copied === t.id ? <Check size={12}/> : <Copy size={12}/>} {copied === t.id ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-text-primary bg-surface-2 rounded-lg p-3">{t.body}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3" style={{ borderColor: "rgba(239,68,68,0.20)", backgroundColor: "rgba(239,68,68,0.04)" }}>
        <span className="text-base flex-shrink-0">📱</span>
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-primary">Compliance.</span> WhatsApp Business API templates need pre-approval. SMS broadcasts must include "STOP to opt out" in regulated markets. Africa's Talking is wired into ROSTER's stack — production sending coming with the next infra release.
        </p>
      </div>
    </ResourcePage>
  );
}
