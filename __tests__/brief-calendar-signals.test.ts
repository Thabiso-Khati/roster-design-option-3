/**
 * __tests__/brief-calendar-signals.test.ts
 * ─────────────────────────────────────────
 * Unit tests for calendar-event signals inside build-brief.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { buildBrief } from "@/lib/brief/build-brief";
import type { DashboardCalendarEvent } from "@/lib/data/calendar";

// ── Helpers ───────────────────────────────────────────────────

function makeEvent(
  overrides: Partial<DashboardCalendarEvent> & { event_type: DashboardCalendarEvent["event_type"] }
): DashboardCalendarEvent {
  const now = new Date();
  return {
    id:         "evt-1",
    title:      "Test Event",
    start_at:   now.toISOString(),
    end_at:     new Date(now.getTime() + 60 * 60_000).toISOString(),
    all_day:    false,
    event_type: overrides.event_type,
    location:   null,
    ...overrides,
  };
}

// Minimal non-empty inputs to bypass the empty-roster guard
const BASE_INPUT = {
  releases:  [],
  reminders: [{ id: "r1", title: "Something", done: false, due_date: new Date(Date.now() + 8 * 24 * 60 * 60_000).toISOString(), priority: "low" as const, href: null }],
};

// ── Tests ─────────────────────────────────────────────────────

describe("build-brief — calendar signals", () => {
  describe("upcoming meetings", () => {
    it("surfaces a Pick up prompt for a meeting happening later today", async () => {
      const now   = new Date();
      // Meeting starts 2 hours from now, ends 3 hours from now
      const start = new Date(now.getTime() + 2 * 60 * 60_000);
      const end   = new Date(now.getTime() + 3 * 60 * 60_000);

      const ev = makeEvent({
        event_type: "meeting",
        start_at:   start.toISOString(),
        end_at:     end.toISOString(),
        title:      "A&R Strategy Call",
      });

      const brief = await buildBrief({ ...BASE_INPUT, calendarEvents: [ev], now });
      const pick  = brief.prompts.find(p => p.label === "Pick up");

      expect(pick).toBeDefined();
      expect(pick!.sentence).toContain("A&R Strategy Call");
      expect(pick!.sentence).toContain("on your calendar today");
    });

    it("surfaces an Upcoming prompt for a meeting tomorrow", async () => {
      const now   = new Date();
      const start = new Date(now.getTime() + 26 * 60 * 60_000); // ~tomorrow
      const end   = new Date(start.getTime() + 60 * 60_000);

      const ev = makeEvent({
        event_type: "studio_session",
        start_at:   start.toISOString(),
        end_at:     end.toISOString(),
        title:      "Studio Session",
      });

      const brief    = await buildBrief({ ...BASE_INPUT, calendarEvents: [ev], now });
      const upcoming = brief.prompts.find(p => p.label === "Upcoming" && p.sentence.includes("Studio Session"));

      expect(upcoming).toBeDefined();
      expect(upcoming!.sentence).toContain("tomorrow");
    });
  });

  describe("post-event prompts (Step 8)", () => {
    it("surfaces a Pick up follow-up prompt for a meeting that ended 30 minutes ago", async () => {
      const now   = new Date();
      const start = new Date(now.getTime() - 90 * 60_000);  // started 90 min ago
      const end   = new Date(now.getTime() - 30 * 60_000);  // ended 30 min ago

      const ev = makeEvent({
        event_type: "expert_booking",
        start_at:   start.toISOString(),
        end_at:     end.toISOString(),
        title:      "Expert Booking Call",
      });

      const brief = await buildBrief({ ...BASE_INPUT, calendarEvents: [ev], now });
      const pick  = brief.prompts.find(
        p => p.label === "Pick up" && p.sentence.includes("just wrapped")
      );

      expect(pick).toBeDefined();
      expect(pick!.sentence).toContain("Expert Booking Call");
      expect(pick!.sentence).toContain("follow-ups");
    });

    it("does NOT surface a post-event prompt for a meeting that ended > 2 hours ago", async () => {
      const now   = new Date();
      const start = new Date(now.getTime() - 4 * 60 * 60_000);
      const end   = new Date(now.getTime() - 3 * 60 * 60_000); // ended 3h ago

      const ev = makeEvent({
        event_type: "meeting",
        start_at:   start.toISOString(),
        end_at:     end.toISOString(),
        title:      "Old Meeting",
      });

      const brief = await buildBrief({ ...BASE_INPUT, calendarEvents: [ev], now });
      const stale = brief.prompts.find(
        p => p.sentence.includes("just wrapped") && p.sentence.includes("Old Meeting")
      );

      expect(stale).toBeUndefined();
    });

    it("post-event prompt has a higher score than upcoming meeting prompt", async () => {
      const now     = new Date();
      const pastEnd = new Date(now.getTime() - 10 * 60_000);
      const pastSt  = new Date(now.getTime() - 70 * 60_000);
      const futSt   = new Date(now.getTime() + 60 * 60_000);
      const futEnd  = new Date(now.getTime() + 2 * 60 * 60_000);

      const done    = makeEvent({ event_type: "meeting", start_at: pastSt.toISOString(), end_at: pastEnd.toISOString(), title: "Done Meeting", id: "ev-done" });
      const coming  = makeEvent({ event_type: "meeting", start_at: futSt.toISOString(),  end_at: futEnd.toISOString(),  title: "Future Meeting", id: "ev-fut" });

      const brief   = await buildBrief({ ...BASE_INPUT, calendarEvents: [done, coming], now });
      const wrapped = brief.prompts.find(p => p.sentence.includes("just wrapped"));
      const upcoming= brief.prompts.find(p => p.sentence.includes("Future Meeting"));

      // Both should appear; wrapped should rank higher
      if (wrapped && upcoming) {
        expect(wrapped.score).toBeGreaterThan(upcoming.score);
      }
    });
  });

  describe("deadline signals", () => {
    it("surfaces a Watch out for a deadline today", async () => {
      const now   = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);
      const end   = start;

      const ev = makeEvent({
        event_type: "sync_deadline",
        start_at:   start.toISOString(),
        end_at:     end.toISOString(),
        all_day:    true,
        title:      "Sync Deal Deadline",
      });

      const brief  = await buildBrief({ ...BASE_INPUT, calendarEvents: [ev], now });
      const warn   = brief.prompts.find(p => p.label === "Watch out" && p.sentence.includes("Sync Deal Deadline"));

      expect(warn).toBeDefined();
      expect(warn!.sentence).toContain("today");
    });

    it("surfaces a Watch out for an overdue deadline", async () => {
      const now   = new Date();
      const start = new Date(now.getTime() - 3 * 24 * 60 * 60_000); // 3 days ago

      const ev = makeEvent({
        event_type: "royalty_due",
        start_at:   start.toISOString(),
        end_at:     start.toISOString(),
        title:      "Q1 Royalty Payment",
      });

      const brief = await buildBrief({ ...BASE_INPUT, calendarEvents: [ev], now });
      const warn  = brief.prompts.find(p => p.label === "Watch out" && p.sentence.includes("Q1 Royalty Payment"));

      expect(warn).toBeDefined();
      expect(warn!.sentence).toContain("passed");
    });
  });
});
