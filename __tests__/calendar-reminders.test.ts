/**
 * __tests__/calendar-reminders.test.ts
 * ─────────────────────────────────────
 * Unit tests for lib/calendar/reminders.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPublishJSON = vi.fn();
vi.mock("@upstash/qstash", () => ({
  Client: vi.fn().mockImplementation(() => ({ publishJSON: mockPublishJSON })),
  Receiver: vi.fn(),
}));

// ── Tests ────────────────────────────────────────────────────

import { scheduleEventReminders, cancelEventReminders, formatReminderDuration } from "@/lib/calendar/reminders";

const FUTURE_START = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // +2 hours

const BASE_EVENT = {
  id:                "evt-123",
  user_id:           "usr-456",
  title:             "Studio Session",
  start_at:          FUTURE_START,
  event_type:        "studio_session",
  reminder_email:    true,
  reminder_whatsapp: false,
  reminder_minutes:  [60, 15],
  reminder_job_ids:  [],
};

beforeEach(() => {
  vi.stubEnv("QSTASH_TOKEN",        "test-token");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
  mockPublishJSON.mockResolvedValue({ messageId: "msg-abc" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ── scheduleEventReminders ────────────────────────────────────

describe("scheduleEventReminders", () => {
  it("schedules one job per reminder_minutes offset (future only)", async () => {
    const jobIds = await scheduleEventReminders(BASE_EVENT);

    // Both offsets are in the future → 2 calls
    expect(mockPublishJSON).toHaveBeenCalledTimes(2);
    expect(jobIds).toEqual(["msg-abc", "msg-abc"]);

    // Each call should hit the correct endpoint
    const calls = mockPublishJSON.mock.calls;
    expect(calls[0][0].url).toBe("https://app.example.com/api/queue/calendar-reminder");
    expect(calls[0][0].body.type).toBe("calendar_reminder");
    expect(calls[0][0].body.minutes_before).toBe(60);
    expect(calls[1][0].body.minutes_before).toBe(15);
  });

  it("skips offsets that are already in the past", async () => {
    // Event starts in 30 minutes — 60-min offset is already past
    const soonEvent = {
      ...BASE_EVENT,
      start_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const jobIds = await scheduleEventReminders(soonEvent);

    // Only the 15-min offset is still in the future
    expect(mockPublishJSON).toHaveBeenCalledTimes(1);
    expect(mockPublishJSON.mock.calls[0][0].body.minutes_before).toBe(15);
    expect(jobIds).toHaveLength(1);
  });

  it("returns [] when no reminders requested", async () => {
    const noReminders = {
      ...BASE_EVENT,
      reminder_email:    false,
      reminder_whatsapp: false,
    };

    const jobIds = await scheduleEventReminders(noReminders);
    expect(mockPublishJSON).not.toHaveBeenCalled();
    expect(jobIds).toEqual([]);
  });

  it("returns [] when reminder_minutes is empty", async () => {
    const jobIds = await scheduleEventReminders({ ...BASE_EVENT, reminder_minutes: [] });
    expect(mockPublishJSON).not.toHaveBeenCalled();
    expect(jobIds).toEqual([]);
  });

  it("returns [] when QStash is not configured", async () => {
    vi.stubEnv("QSTASH_TOKEN", "");

    const jobIds = await scheduleEventReminders(BASE_EVENT);
    expect(mockPublishJSON).not.toHaveBeenCalled();
    expect(jobIds).toEqual([]);
  });

  it("passes correct notBefore timestamp for each offset", async () => {
    await scheduleEventReminders(BASE_EVENT);

    const eventStartMs = new Date(FUTURE_START).getTime();
    const calls        = mockPublishJSON.mock.calls;

    // 60-min offset
    const expected60 = Math.floor((eventStartMs - 60 * 60_000) / 1000);
    expect(calls[0][0].notBefore).toBe(expected60);

    // 15-min offset
    const expected15 = Math.floor((eventStartMs - 15 * 60_000) / 1000);
    expect(calls[1][0].notBefore).toBe(expected15);
  });

  it("cancels previous job IDs before scheduling new ones", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response());

    const eventWithPrevJobs = {
      ...BASE_EVENT,
      reminder_job_ids: ["old-msg-1", "old-msg-2"],
    };

    await scheduleEventReminders(eventWithPrevJobs);

    // Should have called DELETE for each old job
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toContain("old-msg-1");
    expect(fetchSpy.mock.calls[1][0]).toContain("old-msg-2");

    fetchSpy.mockRestore();
  });

  it("continues scheduling even if one publishJSON call fails", async () => {
    mockPublishJSON
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ messageId: "msg-xyz" });

    const jobIds = await scheduleEventReminders(BASE_EVENT);

    // Should still return the successful one
    expect(jobIds).toEqual(["msg-xyz"]);
  });
});

// ── cancelEventReminders ──────────────────────────────────────

describe("cancelEventReminders", () => {
  it("sends DELETE for each job ID", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response());

    await cancelEventReminders(["msg-1", "msg-2", "msg-3"]);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    for (const call of fetchSpy.mock.calls) {
      expect((call[1] as RequestInit).method).toBe("DELETE");
    }

    fetchSpy.mockRestore();
  });

  it("does nothing when jobIds is empty", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response());
    await cancelEventReminders([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does nothing when token is absent", async () => {
    vi.stubEnv("QSTASH_TOKEN", "");
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response());
    await cancelEventReminders(["msg-1"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

// ── formatReminderDuration ────────────────────────────────────

describe("formatReminderDuration", () => {
  it("formats minutes under 60 correctly", () => {
    expect(formatReminderDuration(15)).toBe("15 minutes");
    expect(formatReminderDuration(1)).toBe("1 minute");
    expect(formatReminderDuration(30)).toBe("30 minutes");
  });

  it("formats exact hours correctly", () => {
    expect(formatReminderDuration(60)).toBe("1 hour");
    expect(formatReminderDuration(120)).toBe("2 hours");
  });

  it("formats exact days correctly", () => {
    expect(formatReminderDuration(1440)).toBe("1 day");
    expect(formatReminderDuration(10080)).toBe("7 days");
  });

  it("falls back to minutes for non-integer hour/day values", () => {
    expect(formatReminderDuration(90)).toBe("90 minutes");
  });
});
