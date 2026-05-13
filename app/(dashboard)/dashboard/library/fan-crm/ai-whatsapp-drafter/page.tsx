"use client";
import { AIDrafter } from "@/components/library/ai-drafter";

export default function AIWhatsAppDrafterPage() {
  return (
    <AIDrafter
      parentHref="/dashboard/library/fan-crm"
      parentLabel="Back to Fan, CRM and Audience"
      color="#EF4444"
      tag="CRM · AI Drafter"
      title="AI WhatsApp Drafter"
      intro="WhatsApp is the dominant business channel in SA and NG. Draft a short, mobile-friendly message in your voice, with no fabricated numbers."
      tool="whatsapp-draft"
      toolSlug="ai-whatsapp-drafter"
      fields={[
        { key: "recipientName", label: "Recipient name", placeholder: "First name" },
        { key: "recipientRole", label: "Recipient role", placeholder: "Promoter / fan / journalist / festival programmer" },
        { key: "intent", label: "Intent", placeholder: "Follow-up / introduction / reminder / drop alert" },
        { key: "previousMessage", label: "Previous thread context", placeholder: "Paste prior messages or describe", multiline: true },
        { key: "ask", label: "The ask (one specific thing)", placeholder: "What you want them to do" },
      ]}
    />
  );
}
