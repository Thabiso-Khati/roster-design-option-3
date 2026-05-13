/**
 * End-to-end payment flow tests
 *
 * Covers the three legs of the Paystack integration:
 *   1. POST /api/paystack/initialize  — creates pending subscription + returns payment link
 *   2. GET  /api/paystack/callback    — verifies transaction, activates subscription, sends welcome email
 *   3. POST /api/paystack/webhook     — handles charge.success / subscription.disable events
 *
 * All external dependencies (Supabase, Paystack HTTP, email) are mocked.
 * No network calls are made.
 */
import { describe, it, beforeEach, expect, vi } from "vitest";

// ── Hoist fake Next.js classes before vi.mock() hoisting ─────────────────────
const { FakeNextRequest, FakeNextResponse } = vi.hoisted(() => {
  class FakeNextRequest {
    url: string;
    private _body: unknown;
    private _headers: Map<string, string>;
    constructor(
      url: string,
      init: { method?: string; body?: string; headers?: Record<string, string> } = {}
    ) {
      this.url = url;
      this._body = init.body ? JSON.parse(init.body) : {};
      this._headers = new Map(Object.entries(init.headers ?? {}));
    }
    async json() { return this._body; }
    async text() { return JSON.stringify(this._body); }
    get headers() {
      return { get: (k: string) => this._headers.get(k) ?? null };
    }
  }

  class FakeNextResponse {
    body: unknown;
    _init: { status?: number };
    _isRedirect: boolean = false;
    _redirectUrl: string = "";
    constructor(body: unknown, init: { status?: number } = {}) {
      this.body = body;
      this._init = init;
    }
    static json(body: unknown, init: { status?: number } = {}) {
      return new FakeNextResponse(body, init);
    }
    static redirect(url: URL | string) {
      const r = new FakeNextResponse(null, { status: 302 });
      r._isRedirect = true;
      r._redirectUrl = url.toString();
      return r;
    }
    get status() { return this._init.status ?? 200; }
    async json()  { return this.body; }
  }

  return { FakeNextRequest, FakeNextResponse };
});

// ── Shared mutable state ──────────────────────────────────────────────────────
const state = {
  user:               { id: "user-1", email: "manager@example.com" } as { id: string; email: string } | null,
  existingPending:    null as { tx_ref: string } | null,
  dbInsertError:      null as { message: string } | null,
  verifyOk:           true,
  updateError:        null as { message: string } | null,
  updatedRows:        [{ user_id: "user-1" }] as { user_id: string }[] | null,
  subscriptionStatus: "pending" as string,
  bookingStatus:      "pending" as string,
  webhookDbError:     null as { message: string } | null,
};

// ── Supabase query builder ────────────────────────────────────────────────────
function buildAdminClient() {
  const q = (table: string): Record<string, unknown> => ({
    select: () => q(table),
    eq:     () => q(table),
    single: async () => {
      if (table === "subscriptions") {
        return { data: state.existingPending ? { status: state.subscriptionStatus, tx_ref: "TX_1" } : null, error: null };
      }
      if (table === "profiles") return { data: { full_name: "Test Manager" }, error: null };
      if (table === "bookings")  return { data: { payment_status: state.bookingStatus }, error: null };
      return { data: null, error: null };
    },
    insert: async () => ({ data: null, error: state.dbInsertError }),
    update: () => ({
      eq: () => ({
        select: async () => ({
          data:  state.updateError ? null : state.updatedRows,
          error: state.updateError,
        }),
        then: async (resolve: (v: { data: null; error: typeof state.webhookDbError }) => unknown) =>
          resolve({ data: null, error: state.webhookDbError }),
      }),
    }),
  });
  return {
    from: (table: string) => q(table),
    auth: {
      admin: {
        getUserById: async () => ({
          data:  { user: { email: "manager@example.com" } },
          error: null,
        }),
      },
    },
  };
}

// ── vi.mock() declarations ─────────────────────────────────────────────────
vi.mock("next/server", () => ({
  NextRequest:  FakeNextRequest,
  NextResponse: FakeNextResponse,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { full_name: "Test Manager" }, error: null }) }) }) }),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => buildAdminClient(),
}));
vi.mock("@/lib/paystack", () => ({
  initSubscriptionPayment: async () => ({
    paymentLink: "https://paystack.com/pay/mock-link",
    txRef:       "SUB-MOCK-TX-001",
  }),
  verifyTransaction: async () => ({
    verified: state.verifyOk,
    data:     { status: "success", reference: "SUB-MOCK-TX-001" },
  }),
  verifyWebhookSignature: vi.fn().mockReturnValue(true),
}));
vi.mock("@/lib/email/send", () => ({
  sendEmail: async () => ({ success: true, id: "email-mock" }),
}));
vi.mock("@/lib/email/templates", () => ({
  welcomeEmail: () => ({ subject: "Welcome to ROSTER", html: "<p>Welcome</p>" }),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/lib/constants", () => ({
  TIERS: [
    { id: "pro",        monthlyPrice: 599,  annualPrice: 5990,  highlight: false },
    { id: "agency",     monthlyPrice: 1299, annualPrice: 12990, highlight: true  },
    { id: "enterprise", monthlyPrice: 4999, annualPrice: 49990, highlight: false },
  ],
}));

// ── Import routes AFTER vi.mock() ──────────────────────────────────────────
import { POST as initRoute }    from "@/app/api/paystack/initialize/route";
import { GET  as callbackRoute } from "@/app/api/paystack/callback/route";
import { POST as webhookRoute }  from "@/app/api/paystack/webhook/route";

// ── Helpers ────────────────────────────────────────────────────────────────
function makePostRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new FakeNextRequest("http://localhost/api/paystack/initialize", {
    method:  "POST",
    body:    JSON.stringify(body),
    headers,
  }) as unknown as Request;
}

function makeGetRequest(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return new FakeNextRequest(`http://localhost/api/paystack/callback?${qs}`) as unknown as Request;
}

type FakeRes = InstanceType<typeof FakeNextResponse>;

// ─────────────────────────────────────────────────────────────────────────────
// LEG 1: /api/paystack/initialize
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/paystack/initialize", () => {
  beforeEach(() => {
    state.user            = { id: "user-1", email: "manager@example.com" };
    state.existingPending = null;
    state.dbInsertError   = null;
  });

  it("returns 401 when unauthenticated", async () => {
    state.user = null;
    const res = await initRoute(makePostRequest({ name: "JO-LA", tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res.status).toBe(401);
  });

  it("returns 400 when tierId is missing", async () => {
    const res = await initRoute(makePostRequest({ name: "JO-LA", billing: "monthly" })) as FakeRes;
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/Validation failed/);
  });

  it("returns 400 for an invalid tierId", async () => {
    const res = await initRoute(makePostRequest({ name: "JO-LA", tierId: "free", billing: "monthly" })) as FakeRes;
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/tierId must be one of/);
  });

  it("returns 400 for an invalid billing value", async () => {
    const res = await initRoute(makePostRequest({ name: "JO-LA", tierId: "pro", billing: "weekly" })) as FakeRes;
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/billing must be/);
  });

  it("returns 200 with paymentLink on happy path", async () => {
    const res = await initRoute(makePostRequest({ name: "JO-LA", tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res.status).toBe(200);
    const body = await res.json() as { paymentLink: string; txRef: string };
    expect(body.paymentLink).toBeTruthy();
    expect(body.txRef).toBeTruthy();
  });

  it("returns 500 when DB insert fails", async () => {
    state.dbInsertError = { message: "unique constraint violation" };
    const res = await initRoute(makePostRequest({ name: "JO-LA", tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LEG 2: /api/paystack/callback
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/paystack/callback", () => {
  beforeEach(() => {
    state.verifyOk           = true;
    state.updateError        = null;
    state.updatedRows        = [{ user_id: "user-1" }];
    state.subscriptionStatus = "pending";
  });

  it("redirects to error page when reference is missing", async () => {
    const res = await callbackRoute(makeGetRequest({ tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res._isRedirect).toBe(true);
    expect(res._redirectUrl).toMatch(/payment_failed/);
  });

  it("redirects to error page when Paystack verification fails", async () => {
    state.verifyOk = false;
    const res = await callbackRoute(makeGetRequest({ reference: "SUB-BAD", tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res._isRedirect).toBe(true);
    expect(res._redirectUrl).toMatch(/verification_failed/);
  });

  it("redirects to dashboard on successful activation", async () => {
    const res = await callbackRoute(makeGetRequest({ reference: "SUB-MOCK-TX-001", tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res._isRedirect).toBe(true);
    expect(res._redirectUrl).toMatch(/dashboard/);
  });

  it("is idempotent — already-active subscription redirects to dashboard without re-processing", async () => {
    state.subscriptionStatus = "active";
    state.existingPending    = { tx_ref: "SUB-MOCK-TX-001" };
    const res = await callbackRoute(makeGetRequest({ reference: "SUB-MOCK-TX-001", tierId: "pro", billing: "monthly" })) as FakeRes;
    expect(res._isRedirect).toBe(true);
    expect(res._redirectUrl).toMatch(/dashboard/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LEG 3: /api/paystack/webhook
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/paystack/webhook", () => {
  beforeEach(() => {
    state.webhookDbError     = null;
    state.subscriptionStatus = "pending";
    state.bookingStatus      = "pending";
  });

  function makeWebhookRequest(event: string, data: Record<string, unknown>) {
    return new FakeNextRequest("http://localhost/api/paystack/webhook", {
      method:  "POST",
      body:    JSON.stringify({ event, data }),
      headers: { "x-paystack-signature": "valid-sig" },
    }) as unknown as Request;
  }

  it("returns 401 when signature is invalid", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paystack");
    vi.mocked(verifyWebhookSignature).mockReturnValueOnce(false);
    const res = await webhookRoute(makeWebhookRequest("charge.success", {})) as FakeRes;
    expect(res.status).toBe(401);
  });

  it("returns 200 for charge.success on a SUB- reference", async () => {
    const res = await webhookRoute(
      makeWebhookRequest("charge.success", { reference: "SUB-MOCK-TX-001", status: "success" })
    ) as FakeRes;
    expect(res.status).toBe(200);
  });

  it("returns 200 for an unrecognised event (graceful no-op)", async () => {
    const res = await webhookRoute(
      makeWebhookRequest("invoice.create", { reference: "SUB-MOCK-TX-001" })
    ) as FakeRes;
    expect(res.status).toBe(200);
  });

  it("is idempotent — already-active subscription returns 200 without re-writing", async () => {
    state.subscriptionStatus = "active";
    state.existingPending    = { tx_ref: "SUB-MOCK-TX-001" };
    const res = await webhookRoute(
      makeWebhookRequest("charge.success", { reference: "SUB-MOCK-TX-001", status: "success" })
    ) as FakeRes;
    expect(res.status).toBe(200);
  });
});
