/**
 * Unit tests — lib/queue/transact.ts
 *
 * Run:  npm test
 *
 * Coverage:
 *   enqueueTransact()
 *     • returns { queued: false } when QSTASH_TOKEN is absent
 *     • returns { queued: false } when NEXT_PUBLIC_APP_URL is absent
 *     • calls publishJSON with correct url / body / retries
 *     • returns { queued: true, messageId } on success
 *     • returns { queued: false, error } when QStash SDK throws
 *
 *   getQStashReceiver()
 *     • returns null when signing keys are absent
 *     • returns a Receiver instance when both keys are present
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// ── Mock @upstash/qstash before importing the module under test ─────────────
const mockPublishJSON = vi.fn();
const mockReceiver    = { verify: vi.fn() };

vi.mock("@upstash/qstash", () => ({
  Client:   vi.fn().mockImplementation(() => ({ publishJSON: mockPublishJSON })),
  Receiver: vi.fn().mockImplementation(() => mockReceiver),
}));

import { enqueueTransact, getQStashReceiver } from "@/lib/queue/transact";

// ── Helpers ─────────────────────────────────────────────────────────────────
const EMAIL_JOB  = { type: "email"    as const, to: "fan@example.com", subject: "Hi", html: "<p>Hi</p>" };
const WA_JOB     = { type: "whatsapp" as const, to: "+27831234567",    body: "Hello!" };

afterEach(() => {
  vi.unstubAllEnvs();
  mockPublishJSON.mockReset();
});

// ── enqueueTransact ──────────────────────────────────────────────────────────
describe("enqueueTransact", () => {
  it("returns { queued: false } when QSTASH_TOKEN is not set", async () => {
    vi.stubEnv("QSTASH_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.rosterapp.ai");

    const result = await enqueueTransact(EMAIL_JOB);

    expect(result.queued).toBe(false);
    expect(mockPublishJSON).not.toHaveBeenCalled();
  });

  it("returns { queued: false } when NEXT_PUBLIC_APP_URL is not set", async () => {
    vi.stubEnv("QSTASH_TOKEN", "qstash-token-abc");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    const result = await enqueueTransact(WA_JOB);

    expect(result.queued).toBe(false);
    expect(mockPublishJSON).not.toHaveBeenCalled();
  });

  it("calls publishJSON with correct url, body, and retries on success", async () => {
    vi.stubEnv("QSTASH_TOKEN", "qstash-token-abc");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.rosterapp.ai");
    mockPublishJSON.mockResolvedValueOnce({ messageId: "msg_123" });

    const result = await enqueueTransact(EMAIL_JOB);

    expect(mockPublishJSON).toHaveBeenCalledOnce();
    expect(mockPublishJSON).toHaveBeenCalledWith({
      url:     "https://app.rosterapp.ai/api/queue/transact",
      body:    EMAIL_JOB,
      retries: 3,
    });
    expect(result).toEqual({ queued: true, messageId: "msg_123" });
  });

  it("returns { queued: true, messageId } for a WhatsApp job", async () => {
    vi.stubEnv("QSTASH_TOKEN", "qstash-token-abc");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.rosterapp.ai");
    mockPublishJSON.mockResolvedValueOnce({ messageId: "msg_wa_456" });

    const result = await enqueueTransact(WA_JOB);

    expect(result).toEqual({ queued: true, messageId: "msg_wa_456" });
    expect(mockPublishJSON).toHaveBeenCalledWith(
      expect.objectContaining({ body: WA_JOB }),
    );
  });

  it("returns { queued: false, error } when QStash SDK throws", async () => {
    vi.stubEnv("QSTASH_TOKEN", "qstash-token-abc");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.rosterapp.ai");
    mockPublishJSON.mockRejectedValueOnce(new Error("Network timeout"));

    const result = await enqueueTransact(EMAIL_JOB);

    expect(result.queued).toBe(false);
    expect(result.error).toBe("Network timeout");
  });

  it("handles non-Error throws from QStash SDK", async () => {
    vi.stubEnv("QSTASH_TOKEN", "qstash-token-abc");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.rosterapp.ai");
    mockPublishJSON.mockRejectedValueOnce("string error");

    const result = await enqueueTransact(EMAIL_JOB);

    expect(result.queued).toBe(false);
    expect(result.error).toBe("Unknown QStash error");
  });
});

// ── getQStashReceiver ────────────────────────────────────────────────────────
describe("getQStashReceiver", () => {
  it("returns null when QSTASH_CURRENT_SIGNING_KEY is absent", () => {
    vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "");
    vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "next-key");

    expect(getQStashReceiver()).toBeNull();
  });

  it("returns null when QSTASH_NEXT_SIGNING_KEY is absent", () => {
    vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "current-key");
    vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "");

    expect(getQStashReceiver()).toBeNull();
  });

  it("returns a Receiver instance when both signing keys are present", () => {
    vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "current-key");
    vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "next-key");

    const receiver = getQStashReceiver();

    expect(receiver).not.toBeNull();
    expect(receiver).toHaveProperty("verify");
  });
});
