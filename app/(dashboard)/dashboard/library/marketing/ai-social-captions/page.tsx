"use client";
import { AIDrafter } from "@/components/library/ai-drafter";

export default function AISocialCaptionsDrafterPage() {
  return (
    <AIDrafter
      parentHref="/dashboard/library/marketing"
      parentLabel="Back to Marketing"
      color="#8B5CF6"
      tag="Marketing · AI Drafter"
      title="AI Social Captions"
      intro="Generate platform-optimised captions for TikTok, Instagram, Twitter/X and Facebook. Includes hook, body, call-to-action, and hashtags tuned for African audiences. Edit before posting — AI never posts for you."
      tool="caption-generate"
      toolSlug="ai-social-captions"
      fields={[
        {
          key: "platform",
          label: "Platform",
          placeholder: "TikTok / Instagram Reels / Instagram Feed / Twitter/X / Facebook",
        },
        {
          key: "contentType",
          label: "Content type",
          placeholder: "Release teaser / day-in-life / behind-the-scenes / opinion / origin story / milestone",
        },
        {
          key: "contentDescription",
          label: "Describe the video or post",
          placeholder: "What's actually happening in the content? The more specific, the better the caption.",
          multiline: true,
        },
        {
          key: "tone",
          label: "Tone / vibe",
          placeholder: "Hype / reflective / funny / cinematic / raw / informative",
        },
        {
          key: "callToAction",
          label: "Call to action (optional)",
          placeholder: "Stream now / pre-save link / comment your thoughts / share if you feel this",
        },
        {
          key: "hashtagStyle",
          label: "Hashtag style",
          placeholder: "SA-specific / global Afrobeats / minimal / broad reach",
        },
      ]}
      next={{ href: "/dashboard/library/marketing/one-sheet", label: "One-Sheet Builder" }}
    />
  );
}
