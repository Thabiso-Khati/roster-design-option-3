/**
 * Unit tests — app/api/queue/transact/route.ts  (QStash consumer)
 *
 * Run:  npm test
 *
 * Coverage:
 *   POST handler (no receiver — local dev path, no sig verification)
 *     • email job: calls sendEmail, returns { ok: true, id }
 *     • email job passes replyTo through
 *     • whatsapp job: calls sendWhatsApp, returns { ok: true, sid }
 *     • sendEmail failure: returns HTTP 500 (triggers QStash retry)
 *     • sendWhatsApp failure: returns HTTP 500
 *     • unknown job type: returns HTTP 400 (no retry)
 *
 *   POST handler (with receiver — production path)
 *     • invalid signature: returns HTTP 401, no send attempted
 *     • receiver.verify throws: returns HTTP 401
 *     • valid signature: proceeds to send
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Use vi.hoisted so mock fns exist before vi.mock() hoisted calls ──────────
const { mockSendEmail, mockSendWhatsApp, mockGetQStashReceiver } = vi.hoisted(() => ({
  mockSendEmail:          vi.fn(),
  mockSendWhatsApp:       vi.fn(),
  mockGetQStashReceiver:  vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/email/send",         () => ({ sendEmail:           mockSendEmail         }));
vi.mock("@/lib/campaigns/whatsapp", () => ({ sendWhatsApp:        mockSendWhatsApp      }));
vi.mock("@/lib/queue/transact",     () => ({ getQStashReceiver:   mockGetQStashReceiver }));

import { POST } from "@/app/api/queue/transact/route";

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/queue/transact", {
    method:  "POST",
    body:    JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

afterEach(() => {
  mockSendEmail.mockReset();
  mockSendWhatsApp.mockReset();
  mockGetQStashReceiver.mockReset();
});

// ── No receiver (local dev path) ─────────────────────────────────────────────
describe("POST /api/queue/transact — no receiver (local dev)", () => {
  beforeEach(() => mockGetQStashReceiver.mockReturnValue(null));

  it("dispatches an email job and returns { ok: true, id }", async () => {
    mockSendEmail.mockResolvedValueOnce({ success: true, id: "email_abc" });

    const res = await POST(makeRequest({
      type: "email", to: "fan@example.com", subject: "Hi", html: "<p>Hi</p>",
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, id: "email_abc" });
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "fan@example.com", subject: "Hi", html: "<p>Hi</p>", replyTo: undefined,
    });
  });

  it("passes replyTo through to sendEmail", async () => {
    mockSendEmail.mockResolvedValueOnce({ success: true, id: "email_xyz" });

    await POST(makeRequest({
      type: "email", to: "a@b.com", subject: "S", html: "<p></p>", replyTo: "reply@b.com",
    }));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: "reply@b.com" }),
    );
  });

  it("dispatches a whatsapp job and returns { ok: true, sid }", async () => {
    mockSendWhatsApp.mockResolvedValueOnce({ success: true, sid: "SM123" });

    const res = await POST(makeRequest({
      type: "whatsapp", to: "+27831234567", body: "Hey 👋", fromNumber: "+14155238886",
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, sid: "SM123" });
    expect(mockSendWhatsApp).toHaveBeenCalledWith({
      to: "+27831234567", body: "Hey 👋", fromNumber: "+14155238886",
    });
  });

  it("returns HTTP 500 when sendEmail fails (triggers QStash retry)", async () => {
    mockSendEmail.mockResolvedValueOnce({ success: false, error: "Resend rate limit" });

    const res = await POST(makeRequest({
      type: "email", to: "a@b.com", subject: "S", html: "<p></p>",
    }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Resend rate limit");
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });

  it("returns HTTP 500 when sendWhatsApp fails (triggers QStash retry)", async () => {
    mockSendWhatsApp.mockResolvedValueOnce({ success: false, error: "Twilio 429" });

    const res = await POST(makeRequest({
      type: "whatsapp", to: "+27831234567", body: "Hi",
    }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Twilio 429");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns HTTP 400 for an unknown job type — does not retry", async () => {
    const res = await POST(makeRequest({ type: "sms", to: "+123", body: "Hi" }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Unknown job type");
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });
});

// ── With receiver (production path) ─────────────────────────────────────────
describe("POST /api/queue/transact — with receiver (production)", () => {
  it("returns HTTP 401 when signature verification fails", async () => {
    mockGetQStashReceiver.mockReturnValue({ verify: vi.fn().mockResolvedValue(false) });

    const res = await POST(makeRequest(
      { type: "email", to: "a@b.com", subject: "S", html: "<p></p>" },
      { "upstash-signature": "bad-sig" },
    ));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Invalid signature");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns HTTP 401 when receiver.verify throws", async () => {
    mockGetQStashReceiver.mockReturnValue({
      verify: vi.fn().mockRejectedValue(new Error("crypto error")),
    });

    const res = await POST(makeRequest(
      { type: "email", to: "a@b.com", subject: "S", html: "<p></p>" },
      { "upstash-signature": "any" },
    ));

    expect(res.status).toBe(401);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("proceeds to send when signature is valid", async () => {
    mockGetQStashReceiver.mockReturnValue({ verify: vi.fn().mockResolvedValue(true) });
    mockSendEmail.mockResolvedValueOnce({ success: true, id: "email_ok" });

    const body = { type: "email", to: "a@b.com", subject: "S", html: "<p></p>" };
    const req  = new NextRequest("http://localhost/api/queue/transact", {
      method:  "POST",
      body:    JSON.stringify(body),
      headers: { "Content-Type": "application/json", "upstash-signature": "valid-sig" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });
});
