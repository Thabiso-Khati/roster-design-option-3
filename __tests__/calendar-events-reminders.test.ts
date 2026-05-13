/**
 * __tests__/calendar-events-reminders.test.ts
 * ─────────────────────────────────────────────
 * Regression tests for the calendar events route's reminder scheduling.
 *
 * Primary regression: POST and PATCH previously fired reminder scheduling in a
 * `void` async IIFE after sending the HTTP response. In Vercel serverless the
 * function is frozen on response send, so QStash publishing never completed and
 * `reminder_job_ids` were never written to the database — reminders never fired.
 *
 * These tests verify:
 *   ✓ POST awaits scheduleEventReminders before returning 201
 *   ✓ POST saves reminder_job_ids via the admin client (not user client)
 *   ✓ POST passes ctx.ownerId (not user.id) to scheduleEventReminders
 *   ✓ PATCH awaits reschedule before returning 200
 *   ✓ PATCH always writes reminder_job_ids back (including empty array)
 *   ✓ POST with no reminders skips scheduling entirely
 *   ✓ Scheduling failure is non-fatal — 201 still returned
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

// ── Hoist fake Next.js classes ────────────────────────────────

const { FakeNextRequest, FakeNextResponse } = vi.hoisted(() => {
  class FakeNextRequest {
    url: string;
    nextUrl: { searchParams: URLSearchParams };
    private _body: unknown;

    constructor(url: string, init: { body?: string } = {}) {
      this.url = url;
      this.nextUrl = { searchParams: new URLSearchParams() };
      this._body = init.body ? JSON.parse(init.body) : {};
    }

    async json() { return this._body; }
  }

  class FakeNextResponse {
    body: unknown;
    _status: number;

    constructor(body: unknown, init: { status?: number } = {}) {
      this.body  = body;
      this._status = init.status ?? 200;
    }

    static json(body: unknown, init: { status?: number } = {}) {
      return new FakeNextResponse(body, init);
    }

    get status() { return this._status; }
    async json() { return this.body; }
  }

  return { FakeNextRequest, FakeNextResponse };
});

// ── Mutable state ─────────────────────────────────────────────

// Must be valid UUIDs — UpdateEventSchema uses z.string().uuid() for the id field
const OWNER_ID       = "aaaaaaaa-0000-4000-8000-000000000001";
const TEAM_MEMBER_ID = "bbbbbbbb-0000-4000-8000-000000000002";
const EVENT_ID       = "cccccccc-0000-4000-8000-000000000003";

const FUTURE_ISO = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
const END_ISO    = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

const BASE_EVENT_ROW = {
  id:                EVENT_ID,
  title:             "Studio Session",
  description:       null,
  location:          null,
  start_at:          FUTURE_ISO,
  end_at:            END_ISO,
  all_day:           false,
  event_type:        "studio_session",
  source_type:       "manual",
  reminder_email:    true,
  reminder_whatsapp: false,
  reminder_minutes:  [60, 15],
  reminder_job_ids:  [],
  privacy:           "private",
  color:             null,
  user_id:           OWNER_ID,
};

// Mutable mock controls
let mockUser: { id: string } | null = { id: OWNER_ID };
let mockInsertedEvent: typeof BASE_EVENT_ROW | null = BASE_EVENT_ROW;
let mockInsertError: object | null = null;
let mockUpdateError: object | null = null;
let mockExistingEvent: { source_type: string; reminder_job_ids: string[] } | null = {
  source_type: "manual",
  reminder_job_ids: ["old-job-1"],
};

// Track admin update calls
const adminUpdateCalls: Array<{ reminder_job_ids: string[] }> = [];

// ── Mocks ────────────────────────────────────────────────────

vi.mock("next/server", () => ({
  NextRequest:  FakeNextRequest,
  NextResponse: FakeNextResponse,
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Supabase user client — simulates owner's session
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => {
      if (table === "calendar_events") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data:  mockInsertedEvent,
                error: mockInsertError,
              })),
            })),
          })),
          update: vi.fn(() => ({
            // user-client update — NOT for reminder_job_ids
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data:  mockInsertedEvent,
                    error: mockUpdateError,
                  })),
                })),
              })),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: mockExistingEvent,
                  error: null,
                })),
              })),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

// Admin client — used for reminder_job_ids update
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "calendar_events") {
        return {
          update: vi.fn((payload: { reminder_job_ids: string[] }) => {
            adminUpdateCalls.push(payload);
            return {
              eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            };
          }),
        };
      }
      return {};
    }),
  })),
}));

// Workspace context — owner by default
vi.mock("@/lib/workspace/context", () => ({
  getWorkspaceContext: vi.fn(async () => ({
    isOwner:     true,
    ownerId:     OWNER_ID,
    role:        "owner",
    permissions: { calendar: { view: true, edit: true } },
  })),
}));

// Schedule reminders — returns predictable job IDs
const mockSchedule = vi.fn(async () => ["job-id-1", "job-id-2"]);
vi.mock("@/lib/calendar/reminders", () => ({
  scheduleEventReminders: (...args: unknown[]) => mockSchedule(...args),
  cancelEventReminders:   vi.fn(async () => {}),
  formatReminderDuration: vi.fn((m: number) => `${m} minutes`),
}));

// ── Import route handlers ─────────────────────────────────────

import { POST, PATCH } from "@/app/api/calendar/events/route";

// ── Helpers ───────────────────────────────────────────────────

function makePostRequest(overrides: Record<string, unknown> = {}) {
  return new FakeNextRequest("http://localhost/api/calendar/events", {
    body: JSON.stringify({
      title:             "Studio Session",
      start_at:          FUTURE_ISO,
      end_at:            END_ISO,
      event_type:        "studio_session",
      reminder_email:    true,
      reminder_whatsapp: false,
      reminder_minutes:  [60, 15],
      privacy:           "private",
      ...overrides,
    }),
  });
}

function makePatchRequest(overrides: Record<string, unknown> = {}) {
  return new FakeNextRequest("http://localhost/api/calendar/events", {
    body: JSON.stringify({
      id:                EVENT_ID,   // must be a valid UUID to pass Zod's z.string().uuid()
      title:             "Updated Session",
      start_at:          FUTURE_ISO,
      end_at:            END_ISO,
      event_type:        "studio_session",
      reminder_email:    true,
      reminder_whatsapp: false,
      reminder_minutes:  [30],
      privacy:           "private",
      ...overrides,
    }),
  });
}

// ── Setup / teardown ──────────────────────────────────────────

beforeEach(() => {
  mockUser          = { id: OWNER_ID };
  mockInsertedEvent = { ...BASE_EVENT_ROW };
  mockInsertError   = null;
  mockUpdateError   = null;
  mockExistingEvent = { source_type: "manual", reminder_job_ids: ["old-job-1"] };
  adminUpdateCalls.length = 0;
  mockSchedule.mockResolvedValue(["job-id-1", "job-id-2"]);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── POST tests ────────────────────────────────────────────────

describe("POST /api/calendar/events — reminder scheduling", () => {
  it("returns 201 and schedules reminders synchronously (not in void IIFE)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makePostRequest() as any);

    expect(res.status).toBe(201);
    // Scheduling must have been awaited — if it were fire-and-forget,
    // mockSchedule wouldn't be called before we assert here.
    expect(mockSchedule).toHaveBeenCalledOnce();
  });

  it("passes ctx.ownerId (not user.id) to scheduleEventReminders", async () => {
    // Simulate team member session — user.id differs from ctx.ownerId
    mockUser = { id: TEAM_MEMBER_ID };

    const { getWorkspaceContext } = await import("@/lib/workspace/context");
    vi.mocked(getWorkspaceContext).mockResolvedValueOnce({
      isOwner:     false,
      ownerId:     OWNER_ID,      // workspace owner
      role:        "admin",
      permissions: { calendar: { view: true, edit: true } },
    } as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await POST(makePostRequest() as any);

    expect(mockSchedule).toHaveBeenCalledOnce();
    const callArgs = mockSchedule.mock.calls[0][0] as { user_id: string };
    // Must be the OWNER's ID, not the team member's ID
    expect(callArgs.user_id).toBe(OWNER_ID);
    expect(callArgs.user_id).not.toBe(TEAM_MEMBER_ID);
  });

  it("writes reminder_job_ids via admin client (bypasses RLS)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await POST(makePostRequest() as any);

    // Admin client update must have been called with the returned job IDs
    expect(adminUpdateCalls).toHaveLength(1);
    expect(adminUpdateCalls[0].reminder_job_ids).toEqual(["job-id-1", "job-id-2"]);
  });

  it("skips scheduling entirely when no reminder channels are enabled", async () => {
    // The route guards on the *inserted DB row's* reminder flags (event.reminder_email ||
    // event.reminder_whatsapp), not on the raw request body. So the mock must return a
    // row that also has both flags false, matching the request.
    mockInsertedEvent = { ...BASE_EVENT_ROW, reminder_email: false, reminder_whatsapp: false };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await POST(makePostRequest({
      reminder_email:    false,
      reminder_whatsapp: false,
      reminder_minutes:  [],
    }) as any);

    expect(mockSchedule).not.toHaveBeenCalled();
    expect(adminUpdateCalls).toHaveLength(0);
  });

  it("returns 201 even when reminder scheduling throws (non-fatal)", async () => {
    mockSchedule.mockRejectedValueOnce(new Error("QStash unavailable"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makePostRequest() as any);

    expect(res.status).toBe(201);
    // No admin update since scheduling threw
    expect(adminUpdateCalls).toHaveLength(0);
  });

  it("does not call scheduling when event insert fails", async () => {
    mockInsertError   = { message: "DB error" };
    mockInsertedEvent = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makePostRequest() as any);

    expect(res.status).toBe(500);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockUser = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makePostRequest() as any);
    expect(res.status).toBe(401);
  });
});

// ── PATCH tests ───────────────────────────────────────────────

describe("PATCH /api/calendar/events — reminder rescheduling", () => {
  it("returns 200 and reschedules reminders synchronously", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await PATCH(makePatchRequest() as any);

    expect(res.status).toBe(200);
    expect(mockSchedule).toHaveBeenCalledOnce();
  });

  it("passes previous reminder_job_ids to scheduleEventReminders for cancellation", async () => {
    mockExistingEvent = { source_type: "manual", reminder_job_ids: ["stale-job-1", "stale-job-2"] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await PATCH(makePatchRequest() as any);

    const callArgs = mockSchedule.mock.calls[0][0] as { reminder_job_ids: string[] };
    expect(callArgs.reminder_job_ids).toEqual(["stale-job-1", "stale-job-2"]);
  });

  it("writes reminder_job_ids back via admin client", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await PATCH(makePatchRequest() as any);

    expect(adminUpdateCalls).toHaveLength(1);
    expect(adminUpdateCalls[0].reminder_job_ids).toEqual(["job-id-1", "job-id-2"]);
  });

  it("writes empty array when scheduling returns no jobs (clears stale IDs)", async () => {
    mockSchedule.mockResolvedValueOnce([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await PATCH(makePatchRequest() as any);

    // Always write back — even empty — so stale IDs are cleared
    expect(adminUpdateCalls).toHaveLength(1);
    expect(adminUpdateCalls[0].reminder_job_ids).toEqual([]);
  });

  it("returns 200 even when rescheduling throws (non-fatal)", async () => {
    mockSchedule.mockRejectedValueOnce(new Error("QStash timeout"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await PATCH(makePatchRequest() as any);

    expect(res.status).toBe(200);
  });

  it("passes ctx.ownerId (not user.id) to scheduleEventReminders", async () => {
    mockUser = { id: TEAM_MEMBER_ID };

    const { getWorkspaceContext } = await import("@/lib/workspace/context");
    vi.mocked(getWorkspaceContext).mockResolvedValueOnce({
      isOwner:     false,
      ownerId:     OWNER_ID,
      role:        "admin",
      permissions: { calendar: { view: true, edit: true } },
    } as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await PATCH(makePatchRequest() as any);

    const callArgs = mockSchedule.mock.calls[0][0] as { user_id: string };
    expect(callArgs.user_id).toBe(OWNER_ID);
    expect(callArgs.user_id).not.toBe(TEAM_MEMBER_ID);
  });
});
