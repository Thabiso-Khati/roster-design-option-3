export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER AI — Streaming chat endpoint
// POST /api/agents/chat
// ------------------------------------------------------------
// Accepts a message, streams the AI response as SSE, and
// persists both the user message and assistant reply to
// Supabase. Budget is enforced before streaming starts.
//
// SSE event format (newline-delimited JSON):
//   data: {"type":"start","conversationId":"...","messageId":"...","agentType":"..."}
//   data: {"type":"delta","content":"..."}
//   data: {"type":"done","inputTokens":N,"outputTokens":N,"costUsd":N}
//   data: {"type":"error","message":"...","code":"..."}
//   data: {"type":"budget","remaining":N,"resetAt":"..."}
// ============================================================

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBudget, computeCost, recordCall, BudgetExhaustedError } from "@/lib/ai/budget";
import { buildUserContext } from "@/lib/agents/context";
import { buildSystemPrompt, detectAgentType } from "@/lib/agents/system-prompt";
import type { AgentType, ChatRequest, SSEEvent } from "@/lib/agents/types";
import { logger } from "@/lib/logger";

export const runtime   = "nodejs";
export const maxDuration = 60; // Streaming needs a longer timeout

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Model selection ───────────────────────────────────────────────────────────
// Use Haiku for speed/cost on most queries; bump to Sonnet for
// legal/contract/finance queries where quality matters more.
const HEAVY_AGENTS: AgentType[] = ["contracts", "legal", "finance", "royalties"];

function pickModel(agentType: AgentType): string {
  return HEAVY_AGENTS.includes(agentType)
    ? "claude-sonnet-4-6"
    : "claude-haiku-4-5-20251001";
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

function encode(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(encode(event)));
      };

      try {
        // ── Auth ─────────────────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          send({ type: "error", message: "Not authenticated", code: "AUTH_REQUIRED" });
          controller.close();
          return;
        }

        // ── Parse body ───────────────────────────────────────────────────────
        let body: ChatRequest;
        try {
          body = await req.json();
        } catch {
          send({ type: "error", message: "Invalid request body", code: "BAD_REQUEST" });
          controller.close();
          return;
        }

        const { conversationId, message, agentHint } = body;

        if (!message?.trim()) {
          send({ type: "error", message: "Message is required", code: "BAD_REQUEST" });
          controller.close();
          return;
        }

        // ── Budget check ─────────────────────────────────────────────────────
        const budget = await checkBudget(user.id);
        if (!budget.allowed) {
          send({
            type: "budget",
            remaining: 0,
            resetAt: budget.resetAt.toISOString(),
          });
          controller.close();
          return;
        }

        // ── Agent type detection ──────────────────────────────────────────────
        const agentType: AgentType =
          agentHint ?? detectAgentType(message) ?? "orchestrator";

        // ── Conversation management ───────────────────────────────────────────
        const admin = createAdminClient();

        let convId = conversationId;

        if (!convId) {
          // New conversation — create it with a provisional title
          const title = message.length > 60
            ? message.slice(0, 57) + "…"
            : message;
          const { data: newConv, error: convError } = await admin
            .from("conversations")
            .insert({ user_id: user.id, title })
            .select("id")
            .single();
          if (convError || !newConv) {
            send({ type: "error", message: "Failed to create conversation", code: "DB_ERROR" });
            controller.close();
            return;
          }
          convId = newConv.id as string;
        }

        // ── Persist user message ──────────────────────────────────────────────
        const { data: userMsg, error: userMsgError } = await admin
          .from("messages")
          .insert({
            conversation_id: convId,
            user_id: user.id,
            role: "user",
            content: message.trim(),
          })
          .select("id")
          .single();

        if (userMsgError || !userMsg) {
          send({ type: "error", message: "Failed to save message", code: "DB_ERROR" });
          controller.close();
          return;
        }

        // ── Load conversation history (last 20 messages for context) ──────────
        const { data: history } = await admin
          .from("messages")
          .select("role, content")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true })
          .limit(20);

        const messageHistory: Anthropic.MessageParam[] = (history ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        // ── Build user context ────────────────────────────────────────────────
        const userContext = await buildUserContext(user.id);

        // ── Build system prompt ───────────────────────────────────────────────
        const systemPrompt = buildSystemPrompt(agentType, userContext.summary);

        // ── Select model ──────────────────────────────────────────────────────
        const model = pickModel(agentType);

        // ── Reserve assistant message row ─────────────────────────────────────
        const { data: asstMsg, error: asstMsgError } = await admin
          .from("messages")
          .insert({
            conversation_id: convId,
            user_id: user.id,
            role: "assistant",
            content: "",               // will be updated after stream
            agent_type: agentType,
            metadata: { model },
          })
          .select("id")
          .single();

        if (asstMsgError || !asstMsg) {
          send({ type: "error", message: "Failed to reserve assistant message", code: "DB_ERROR" });
          controller.close();
          return;
        }

        // ── Signal start to client ────────────────────────────────────────────
        send({
          type: "start",
          conversationId: convId,
          messageId: asstMsg.id as string,
          agentType,
        });

        // ── Stream from Anthropic ─────────────────────────────────────────────
        let fullContent = "";
        let inputTokens = 0;
        let outputTokens = 0;

        const anthropicStream = anthropic.messages.stream({
          model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: messageHistory,
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const chunk = event.delta.text;
            fullContent += chunk;
            send({ type: "delta", content: chunk });
          }

          if (event.type === "message_delta" && event.usage) {
            outputTokens = event.usage.output_tokens;
          }

          if (event.type === "message_start" && event.message.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }

        // Fallback token counts from final message if the delta events didn't fire
        const finalMessage = await anthropicStream.finalMessage();
        if (finalMessage.usage) {
          inputTokens  = finalMessage.usage.input_tokens;
          outputTokens = finalMessage.usage.output_tokens;
        }

        // ── Compute cost ──────────────────────────────────────────────────────
        const costUsd = computeCost(model, inputTokens, outputTokens);

        // ── Persist completed assistant message ───────────────────────────────
        await admin
          .from("messages")
          .update({ content: fullContent })
          .eq("id", asstMsg.id);

        // ── Update conversation last_message_at ───────────────────────────────
        await admin
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", convId);

        // ── Log to ai_calls + bump spent_usd ──────────────────────────────────
        void recordCall({
          userId: user.id,
          intent: `chat:${agentType}`,
          model,
          inputTokens,
          outputTokens,
          success: true,
        });

        // ── Send done event ───────────────────────────────────────────────────
        send({ type: "done", inputTokens, outputTokens, costUsd });

      } catch (err) {
        if (err instanceof BudgetExhaustedError) {
          const e = err as BudgetExhaustedError;
          controller.enqueue(
            encoder.encode(
              encode({ type: "budget", remaining: 0, resetAt: e.resetAt.toISOString() })
            )
          );
        } else {
          const message = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            encoder.encode(encode({ type: "error", message, code: "INTERNAL_ERROR" }))
          );
          logger.error("[agents/chat] Unhandled error", {}, err);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection:      "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering for SSE
    },
  });
}
