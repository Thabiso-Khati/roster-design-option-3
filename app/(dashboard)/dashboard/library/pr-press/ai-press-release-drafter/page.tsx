"use client";
import { AIDrafter } from "@/components/library/ai-drafter";

export default function AIPressReleaseDrafterPage() {
  return (
    <AIDrafter
      parentHref="/dashboard/library/pr-press"
      parentLabel="Back to PR, Press and Awards"
      color="#F472B6"
      tag="PR · AI Drafter"
      title="AI Press Release Drafter"
      intro="Draft a press release in your artist's voice. Verified-numbers-only rule applies — placeholders for stats not in artist context."
      tool="press-release-draft"
      toolSlug="ai-press-release-drafter"
      fields={[
        { key: "releaseType", label: "Release type", placeholder: "single drop / tour announce / signing / award" },
        { key: "headline", label: "Headline guidance", placeholder: "What's the single sharpest framing? Or leave blank for AI to suggest." },
        { key: "keyFacts", label: "Key facts (bullet list)", placeholder: "• producer\n• featured artist\n• release date\n• markets\n• distribution\n• key collaborators", multiline: true },
        { key: "quote", label: "Quote (optional)", placeholder: "If you already have an artist quote, paste it. Otherwise AI will draft a placeholder.", multiline: true },
        { key: "embargo", label: "Embargo line", placeholder: "FOR IMMEDIATE RELEASE / UNDER EMBARGO UNTIL …" },
      ]}
      next={{ href: "/dashboard/library/pr-press/quotes-library", label: "Quotes Library" }}
    />
  );
}
