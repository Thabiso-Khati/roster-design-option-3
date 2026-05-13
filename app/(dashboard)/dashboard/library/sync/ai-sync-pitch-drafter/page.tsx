"use client";
import { AIDrafter } from "@/components/library/ai-drafter";

export default function AISyncPitchDrafterPage() {
  return (
    <AIDrafter
      parentHref="/dashboard/library/sync"
      parentLabel="Back to Sync"
      color="#22D3EE"
      tag="Sync · AI Drafter"
      title="AI Sync Pitch Drafter"
      intro="A music supervisor gets hundreds of pitches a week. This drafts a sub-90-second-read pitch grounded in your song + their brief. No invented numbers."
      tool="sync-pitch-draft"
      toolSlug="ai-sync-pitch-drafter"
      fields={[
        { key: "supervisorName", label: "Supervisor name", placeholder: "First + last name" },
        { key: "agency", label: "Agency / production co", placeholder: "Sticky Tape Music / FilmOne / etc." },
        { key: "project", label: "Project / show", placeholder: "Title of the show, film, ad, or game" },
        { key: "projectType", label: "Project type", placeholder: "TV episodic / film / ad / trailer / game" },
        { key: "songTitle", label: "Song you're pitching", placeholder: "Track title" },
        { key: "songMood", label: "Mood / fit angle", placeholder: "Why this song fits the brief — short", multiline: true },
        { key: "brief", label: "Brief context (if any)", placeholder: "Paste the supervisor's brief or describe what you've heard they're looking for", multiline: true },
      ]}
    />
  );
}
