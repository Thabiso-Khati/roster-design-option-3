/**
 * Integration tests — POST /api/bookings/create
 *
 * Strategy: mock every external dependency (Supabase, Paystack, email, SMS,
 * logger) and exercise the route's own validation + orchestration logic.
 *
 * Test matrix:
 *   ✓ 401 when unauthenticated
 *   ✓ 400 when required fields are missing
 *   ✓ 403 when no active subscription
 *   ✓ 404 when expert not found
 *   ✓ 200 happy path — expert with Paystack subaccount
 *   ✓ 200 demo path — expert without subaccount (immediate promotion)
 *   ✓ 500 when booking insert fails
 */
import { describe, it, beforeEach, expect, vi } from "vitest";

// ── Hoist fake Next.js classes before vi.mock() hoisting ─────────────────────
const { FakeNextRequest, FakeNextResponse } = vi.hoisted(() => {
  class FakeNextRequest {
    url: string;
    private _body: unknown;
    constructor(
      url: string,
      init: { method?: string; body?: string; headers?: Record<string, string> } = {}
    ) {
      this.url = url;
      this._body = init.body ? JSON.parse(init.body) : {};
    }
    async json() { return this._body; }
  }

  class FakeNextResponse {
    static _lastInstance: InstanceType<typeof FakeNextResponse>;
    body: unknown;
    _init: { status?: number };
    constructor(body: unknown, init: { status?: number } = {}) {
      this.body = body;
      this._init = init;
      FakeNextResponse._lastInstance = this;
    }
    static json(body: unknown, init: { status?: number } = {}) {
      return new FakeNextResponse(body, init);
    }
    get status() { return this._init.status ?? 200; }
    async json() { return this.body; }
  }

  return { FakeNextRequest, FakeNextResponse };
});

// ── Mutable state — reset in beforeEach ───────────────────────────────────────
const state = {
  user:    { id: "user-1", email: "artist@example.com" } as { id: string; email: string } | null,
  sub:     { id: "sub-1" } as { id: string } | null,
  expert: {
    name:                     "Expert One",
    specialty:                "Sync Licensing",
    paystack_subaccount_code: "ACCT_abc",
    user_id:                  "expert-user-1",
  } as { name: string; specialty: string; paystack_subaccount_code: string | null; user_id: string } | null,
  profile:            { full_name: "JO-LA", phone: "+27821234567" } as { full_name: string; phone: string } | null,
  bookingInsertError: null as { message: string } | null,
};

// ── Supabase smart client factory ─────────────────────────────────────────────
function buildSmartClient() {
  const q = (table: string): Record<string, unknown> => ({
    select: () => q(table),
    eq:     () => q(table),
    in:     () => q(table),
    not:    () => q(table),
    gte:    () => q(table),
    order:  () => q(table),
    update: () => q(table),
    single: async () => {
      if (table === "subscriptions") return { data: state.sub,     error: null };
      if (table === "experts")       return { data: state.expert,  error: null };
      if (table === "profiles")      return { data: state.profile, error: null };
      return { data: null, error: null };
    },
    insert: async () => ({ data: null, error: state.bookingInsertError }),
  });
  return {
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from: (table: string) => q(table),
  };
}

// ── vi.mock() declarations ─────────────────────────────────────────────────
vi.mock("next/server", () => ({
  NextRequest:  FakeNextRequest,
  NextResponse: FakeNextResponse,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => buildSmartClient(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    ...buildSmartClient(),
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: { email: "expert@example.com" } },
          error: null,
        }),
      },
    },
  }),
}));
vi.mock("@/lib/paystack", () => ({
  initBookingPayment: async () => ({
    paymentLink: "https://paystack.com/pay/test-link",
    txRef:       "TX_TEST_123",
  }),
}));
vi.mock("@/lib/bookings/promote", () => ({
  promoteBookingToPaid: async () => ({ success: true, bookingId: "booking-1" }),
}));
vi.mock("@/lib/email/send", () => ({
  sendEmail: async () => ({ id: "email-mock-id" }),
}));
vi.mock("@/lib/email/templates", () => ({
  bookingConfirmationEmail:       () => ({ subject: "Booking confirmed", html: "<p>Confirmed</p>" }),
  expertBookingNotificationEmail: () => ({ subject: "New booking",       html: "<p>New booking</p>" }),
}));
vi.mock("@/lib/whatsapp", () => ({
  notifyBookingViaSMS: async () => {},
}));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/constants", () => ({
  BOOKING_COMMISSION: 0.15,
}));
vi.mock("uuid", () => ({
  v4: () => "mock-uuid-1234",
}));

// ── Import route AFTER vi.mock() ───────────────────────────────────────────
import { POST } from "@/app/api/bookings/create/route";

// ── Helpers ────────────────────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}) {
  return new FakeNextRequest("http://localhost/api/bookings/create", {
    method: "POST",
    body:   JSON.stringify(body),
  }) as unknown as Request;
}

const VALID_BODY = {
  expertId:        "550e8400-e29b-41d4-a716-446655440001",
  sessionId:       "550e8400-e29b-41d4-a716-446655440002",
  durationMinutes: 30,
  amount:          50000,
  currency:        "ZAR",
  scheduledAt:     new Date(Date.now() + 86_400_000).toISOString(),
  notes:           "Interested in sync licensing",
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe("POST /api/bookings/create", () => {
  beforeEach(() => {
    state.user    = { id: "user-1", email: "artist@example.com" };
    state.sub     = { id: "sub-1" };
    state.expert  = {
      name:                     "Expert One",
      specialty:                "Sync Licensing",
      paystack_subaccount_code: "ACCT_abc",
      user_id:                  "expert-user-1",
    };
    state.profile            = { full_name: "JO-LA", phone: "+27821234567" };
    state.bookingInsertError = null;
  });

  it("returns 401 when user is not authenticated", async () => {
    state.user = null;
    const res = await POST(makeRequest(VALID_BODY)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when expertId is missing", async () => {
    const { expertId: _dropped, ...rest } = VALID_BODY;
    const res = await POST(makeRequest(rest)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/Validation failed/);
  });

  it("returns 400 when scheduledAt is missing", async () => {
    const { scheduledAt: _dropped, ...rest } = VALID_BODY;
    const res = await POST(makeRequest(rest)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(400);
  });

  it("returns 400 when amount is missing", async () => {
    const { amount: _dropped, ...rest } = VALID_BODY;
    const res = await POST(makeRequest(rest)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(400);
  });

  it("returns 403 when user has no active subscription", async () => {
    state.sub = null;
    const res = await POST(makeRequest(VALID_BODY)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/subscription/i);
  });

  it("returns 404 when expert is not found", async () => {
    state.expert = null;
    const res = await POST(makeRequest(VALID_BODY)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/Expert not found/);
  });

  it("returns 500 when booking insert fails", async () => {
    state.bookingInsertError = { message: "DB error: unique constraint" };
    const res = await POST(makeRequest(VALID_BODY)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(500);
  });

  it("returns 200 with paymentLink when expert has a Paystack subaccount", async () => {
    const res = await POST(makeRequest(VALID_BODY)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(200);
    const body = await res.json() as { bookingId: string; paymentLink: string; success: boolean };
    expect(body.success).toBe(true);
    expect(body.paymentLink).toBeTruthy();
    expect(body.bookingId).toBe("mock-uuid-1234");
  });

  it("returns 200 in demo mode when expert has no Paystack subaccount", async () => {
    state.expert = { ...state.expert!, paystack_subaccount_code: null };
    const res = await POST(makeRequest(VALID_BODY)) as InstanceType<typeof FakeNextResponse>;
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; bookingId: string };
    expect(body.success).toBe(true);
  });
});
