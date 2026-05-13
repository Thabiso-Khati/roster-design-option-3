"use client";
// ============================================================
// ROSTER AI — Chat interface
// /dashboard/assistant
// ============================================================

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import {
  Plus, Send, ChevronLeft, Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ConstellationIcon } from "@/components/icons/constellation-icon";
import { RosterAIBadge } from "@/components/ui/roster-ai-badge";
import {
  type AgentType,
  type Conversation,
  type Message,
  type SSEEvent,
  AGENT_LABELS,
  SUGGESTED_PROMPTS,
} from "@/lib/agents/types";
import { useTranslation } from "@/lib/i18n/hooks";

// ── Agent badge styles (full Tailwind class names so purge keeps them) ────────

const AGENT_BADGE: Record<AgentType, { bg: string; text: string }> = {
  orchestrator: { bg: "bg-brand/10",        text: "text-brand" },
  contracts:    { bg: "bg-blue-500/10",      text: "text-blue-400" },
  royalties:    { bg: "bg-emerald-500/10",   text: "text-emerald-400" },
  releases:     { bg: "bg-purple-500/10",    text: "text-purple-400" },
  marketing:    { bg: "bg-pink-500/10",      text: "text-pink-400" },
  legal:        { bg: "bg-orange-500/10",    text: "text-orange-400" },
  finance:      { bg: "bg-cyan-500/10",      text: "text-cyan-400" },
  industry:     { bg: "bg-amber-500/10",     text: "text-amber-400" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// ── Markdown renderer (zero deps, no dangerouslySetInnerHTML) ─────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(p))     return <em      key={i}>{p.slice(1, -1)}</em>;
        if (/^`[^`]+`$/.test(p))       return (
          <code key={i} className="bg-surface px-1 py-0.5 rounded text-[0.82em] font-mono text-brand">
            {p.slice(1, -1)}
          </code>
        );
        return p;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines   = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0; // key counter

  while (i < lines.length) {
    const line = lines[i];

    // ── Code block ──────────────────────────────────────────
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      nodes.push(
        <pre key={k++} className="bg-background border border-border rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-text-primary whitespace-pre">
          <code>{code.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }

    // ── Headers ─────────────────────────────────────────────
    if (line.startsWith("### ")) {
      nodes.push(<h3 key={k++} className="text-sm font-bold text-text-primary mt-3 mb-1">{renderInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(<h2 key={k++} className="text-base font-bold text-text-primary mt-3 mb-1">{renderInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(<h1 key={k++} className="text-lg font-bold text-text-primary mt-3 mb-1.5">{renderInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // ── Bullet list ─────────────────────────────────────────
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, "")); i++;
      }
      nodes.push(
        <ul key={k++} className="list-disc list-inside space-y-0.5 my-1.5">
          {items.map((it, j) => <li key={j} className="text-sm text-text-primary leading-relaxed">{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // ── Ordered list ────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, "")); i++;
      }
      nodes.push(
        <ol key={k++} className="list-decimal list-inside space-y-0.5 my-1.5">
          {items.map((it, j) => <li key={j} className="text-sm text-text-primary leading-relaxed">{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    // ── Horizontal rule ─────────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={k++} className="border-border my-2" />);
      i++; continue;
    }

    // ── Empty line (skip) ────────────────────────────────────
    if (line.trim() === "") { i++; continue; }

    // ── Regular paragraph ────────────────────────────────────
    nodes.push(
      <p key={k++} className="text-sm text-text-primary leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{nodes}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssistantPage() {
  useTranslation(); // keep i18n context in sync

  const supabase = createClient();

  // State
  const [conversations,    setConversations]    = useState<Conversation[]>([]);
  const [activeConvId,     setActiveConvId]      = useState<string | null>(null);
  const [messages,         setMessages]          = useState<Message[]>([]);
  const [input,            setInput]             = useState("");
  const [streaming,        setStreaming]          = useState(false);
  const [streamContent,    setStreamContent]     = useState("");
  const [streamAgentType,  setStreamAgentType]   = useState<AgentType>("orchestrator");
  const [error,            setError]             = useState<string | null>(null);
  const [budgetExhausted,  setBudgetExhausted]   = useState(false);
  const [showConvList,     setShowConvList]       = useState(true); // mobile: show convs or chat
  const [loadingConvs,     setLoadingConvs]       = useState(true);
  const [loadingMsgs,      setLoadingMsgs]        = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // ── Load conversations ──────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    const { data } = await supabase
      .from("conversations")
      .select("id, user_id, title, created_at, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(50);
    setConversations((data as Conversation[]) ?? []);
    setLoadingConvs(false);
  }, [supabase]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Abort on unmount ────────────────────────────────────────────────────────

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // ── Load messages for active conversation ───────────────────────────────────

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    setLoadingMsgs(true);
    supabase
      .from("messages")
      .select("id, conversation_id, user_id, role, content, agent_type, metadata, created_at")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { setMessages((data as Message[]) ?? []); setLoadingMsgs(false); });
  }, [activeConvId, supabase]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  // ── Auto-resize textarea ────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string, hint?: AgentType) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    setInput("");
    setStreaming(true);
    setStreamContent("");
    setStreamAgentType("orchestrator");
    setShowConvList(false); // mobile: go to chat view

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id:              tempId,
        conversation_id: activeConvId ?? "",
        user_id:         "",
        role:            "user",
        content:         trimmed,
        agent_type:      null,
        metadata:        null,
        created_at:      new Date().toISOString(),
      } as Message,
    ]);

    abortRef.current = new AbortController();

    let resolvedConvId: string | null = activeConvId;

    try {
      const response = await fetch("/api/agents/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ conversationId: activeConvId, message: trimmed, agentHint: hint }),
        signal:  abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: SSEEvent;
          try { event = JSON.parse(raw); } catch { continue; }

          if (event.type === "start") {
            resolvedConvId = event.conversationId;
            setStreamAgentType(event.agentType);
            setActiveConvId(event.conversationId);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, conversation_id: event.conversationId } : m
              )
            );
          }

          if (event.type === "delta") {
            setStreamContent((prev) => prev + event.content);
          }

          if (event.type === "done") {
            // Replace optimistic messages with canonical DB rows
            const { data: fresh } = await supabase
              .from("messages")
              .select("id, conversation_id, user_id, role, content, agent_type, metadata, created_at")
              .eq("conversation_id", resolvedConvId)
              .order("created_at", { ascending: true });
            setMessages((fresh as Message[]) ?? []);
            setStreamContent("");
            setStreaming(false);
            loadConversations();
          }

          if (event.type === "error") {
            setError(event.message);
            setStreaming(false);
            setStreamContent("");
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          }

          if (event.type === "budget") {
            setBudgetExhausted(true);
            setStreaming(false);
            setStreamContent("");
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Something went wrong. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
      setStreaming(false);
      setStreamContent("");
    }
  }, [activeConvId, streaming, supabase, loadConversations]);

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); sendMessage(input); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setStreamContent("");
    setError(null);
    setShowConvList(false);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const openConversation = (id: string) => {
    setActiveConvId(id);
    setStreamContent("");
    setError(null);
    setShowConvList(false);
  };

  const hasMessages = messages.length > 0 || streaming;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    // Fixed overlay: escapes the padded dashboard <main> entirely.
    // lg:left-64 shifts right of the sidebar (w-64). z-30 keeps it below
    // the sidebar (z-40) and mobile nav (z-50).
    <div className="fixed inset-0 lg:left-64 z-30 bg-background flex overflow-hidden">

      {/* ── Left panel: conversation list ─────────────────────────────────── */}
      {/*
        Always in DOM. Mobile: full-width, toggled via showConvList.
        Desktop (lg+): fixed 18rem, always visible — hidden lg:flex ensures
        the panel is never display:none at lg+ regardless of showConvList.
        w-full lg:w-72 provides correct width at each breakpoint.
        twMerge keeps both since they are different breakpoints.
      */}
      <div className={cn(
        "flex-shrink-0 flex flex-col bg-surface border-r border-border",
        "w-full lg:w-72",
        !showConvList && "hidden lg:flex",
      )}>
        {/* Panel header */}
        <div className="px-4 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ConstellationIcon size={18} className="text-brand" />
            <span className="text-sm font-bold text-text-primary tracking-wide">ROSTER AI</span>
          </div>
          <button
            onClick={startNewChat}
            title="New conversation"
            aria-label="New conversation"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {loadingConvs ? (
            <div className="flex items-center justify-center pt-10">
              <Loader2 size={18} className="animate-spin text-text-muted" aria-label="Loading conversations" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-xs text-text-muted px-5 pt-10 leading-relaxed">
              No conversations yet.{" "}
              <button onClick={startNewChat} className="text-brand hover:underline">Start one.</button>
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all mb-0.5 group",
                  activeConvId === conv.id
                    ? "bg-brand/10 text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-2",
                )}
              >
                <p className="text-xs font-medium truncate leading-snug">
                  {conv.title ?? "Untitled conversation"}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {formatRelativeTime(conv.last_message_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: chat ──────────────────────────────────────────────── */}
      {/*
        Always in DOM. Mobile: toggled via showConvList.
        Desktop (lg+): flex-1 fills remaining space, always visible via lg:flex.
      */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        showConvList && "hidden lg:flex",
      )}>
        {/* Mobile back button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <button
            onClick={() => setShowConvList(true)}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-all"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>Chats</span>
          </button>
          <div className="flex items-center gap-2">
            <ConstellationIcon size={15} className="text-brand" />
            <span className="text-xs font-bold text-text-primary">ROSTER AI</span>
          </div>
          <button
            onClick={startNewChat}
            aria-label="New conversation"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            // ── Empty state ──────────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4">
                <ConstellationIcon size={28} className="text-brand" />
              </div>
              <h1 className="text-lg font-bold text-text-primary mb-1.5 flex items-center gap-2">
                <RosterAIBadge size="lg" />
              </h1>
              <p className="text-sm text-text-muted text-center max-w-md mb-8 leading-relaxed">
                Your AI partner for music management — contracts, royalties,
                release strategy, marketing, and more.
              </p>

              <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt.text, prompt.agentHint)}
                    className="text-left p-4 rounded-xl border border-border bg-surface hover:bg-surface-2 hover:border-brand/30 transition-all group"
                  >
                    <p className="text-[10px] font-semibold text-brand uppercase tracking-wider mb-1.5">
                      {prompt.label}
                    </p>
                    <p className="text-xs text-text-muted group-hover:text-text-primary leading-relaxed transition-colors line-clamp-3">
                      {prompt.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // ── Message thread ────────────────────────────────────────────────
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {loadingMsgs && (
                <div className="flex justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-text-muted" aria-label="Loading messages" />
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                      <ConstellationIcon size={14} className="text-brand" />
                    </div>
                  )}

                  <div className={cn("max-w-[85%] sm:max-w-[76%]", msg.role === "user" ? "ml-auto" : "")}>
                    {msg.role === "assistant" && msg.agent_type && (
                      <div className="mb-1.5" aria-label={`Handled by ${AGENT_LABELS[msg.agent_type as AgentType] ?? "ROSTER AI"}`}>
                        {AGENT_LABELS[msg.agent_type as AgentType] ? (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            AGENT_BADGE[msg.agent_type as AgentType]?.bg ?? "bg-surface-2",
                            AGENT_BADGE[msg.agent_type as AgentType]?.text ?? "text-text-muted",
                          )}>
                            {AGENT_LABELS[msg.agent_type as AgentType]}
                          </span>
                        ) : (
                          <RosterAIBadge size="sm" />
                        )}
                      </div>
                    )}

                    <div className={cn(
                      "rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-brand/15 text-text-primary rounded-tr-sm"
                        : "bg-surface-2 rounded-tl-sm",
                    )}>
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MarkdownContent content={msg.content} />
                      )}
                    </div>

                    <p className="text-[10px] text-text-muted mt-1 px-1">
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Streaming bubble */}
              {streaming && (
                <div className="flex gap-3 justify-start" aria-live="polite" aria-atomic="false">
                  <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    <ConstellationIcon size={14} className="text-brand" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[76%]">
                    <div className="mb-1.5">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        AGENT_BADGE[streamAgentType].bg,
                        AGENT_BADGE[streamAgentType].text,
                      )}>
                        {AGENT_LABELS[streamAgentType]}
                      </span>
                    </div>
                    <div className="bg-surface-2 rounded-2xl rounded-tl-sm px-4 py-3 min-h-[40px]">
                      {streamContent ? (
                        <MarkdownContent content={streamContent} />
                      ) : (
                        // Thinking dots
                        <div className="flex gap-1 items-center h-5 pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]"    aria-hidden="true" />
                          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]"  aria-hidden="true" />
                          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]"  aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 pb-2 max-w-3xl mx-auto w-full" role="alert">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
              <AlertCircle size={14} aria-hidden="true" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-error/60 hover:text-error transition-colors" aria-label="Dismiss error">✕</button>
            </div>
          </div>
        )}

        {/* Budget exhausted banner */}
        {budgetExhausted && (
          <div className="px-4 pb-2 max-w-3xl mx-auto w-full" role="alert">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
              <AlertCircle size={14} aria-hidden="true" />
              <span>Your monthly AI quota has been reached. It resets at the start of next month.</span>
            </div>
          </div>
        )}

        {/* Input bar — pb-20 clears fixed mobile nav (h-16) on small screens */}
        <div className="flex-shrink-0 px-4 pb-20 lg:pb-4 pt-2 border-t border-border">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-surface-2 rounded-2xl border border-border focus-within:border-brand/40 transition-colors px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ✦ ROSTER AI anything about your music business…"
                rows={1}
                disabled={streaming || budgetExhausted}
                aria-label="Message input"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none min-h-[24px] max-h-[160px] leading-relaxed disabled:opacity-50"
                style={{ boxShadow: "none" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming || budgetExhausted}
                aria-label="Send message"
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              >
                {streaming ? (
                  <Loader2 size={14} className="animate-spin text-background" aria-hidden="true" />
                ) : (
                  <Send size={14} className="text-background" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-text-muted mt-1.5">
              Enter to send · Shift+Enter for new line · ✦ ROSTER AI can make mistakes — always verify important decisions
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
