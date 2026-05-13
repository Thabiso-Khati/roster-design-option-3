// ============================================================
// ROSTER AI — Agent system TypeScript types
// ============================================================

// ── Agent types ──────────────────────────────────────────────────────────────

/** Each specialist agent handles a distinct domain. The orchestrator
 *  routes based on intent detection and tags every message with the
 *  agent that handled it, so the UI can render the right badge. */
export type AgentType =
  | "orchestrator"   // routes to specialist; handles general queries
  | "contracts"      // draft, review, explain contracts + agreements
  | "royalties"      // royalty splits, statements, collection societies
  | "releases"       // release strategy, timelines, distributor guidance
  | "marketing"      // press, playlists, social, PR, brand
  | "legal"          // music law Q&A (always disclaims — not legal advice)
  | "finance"        // budgets, costs, revenue modelling
  | "industry";      // A&R, label deals, publishing, sync licensing

export const AGENT_LABELS: Record<AgentType, string> = {
  orchestrator: "ROSTER AI",
  contracts:    "Contracts",
  royalties:    "Royalties",
  releases:     "Releases",
  marketing:    "Marketing",
  legal:        "Legal",
  finance:      "Finance",
  industry:     "Industry",
};

export const AGENT_COLORS: Record<AgentType, string> = {
  orchestrator: "brand",
  contracts:    "blue",
  royalties:    "green",
  releases:     "purple",
  marketing:    "pink",
  legal:        "orange",
  finance:      "cyan",
  industry:     "gold",
};

// ── Conversation & Message types ─────────────────────────────────────────────

/** Mirrors the `conversations` Supabase table. */
export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  last_message_at: string;
}

/** Mirrors the `messages` Supabase table. */
export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  agent_type: AgentType | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Streaming event types (SSE) ───────────────────────────────────────────────

/** Discriminated union for all SSE events sent from the chat route.
 *  The client parser switches on `type`. */
export type SSEEvent =
  | { type: "start";    conversationId: string; messageId: string; agentType: AgentType }
  | { type: "delta";    content: string }
  | { type: "done";     inputTokens: number; outputTokens: number; costUsd: number }
  | { type: "error";    message: string; code?: string }
  | { type: "budget";   remaining: number; resetAt: string };

// ── API request / response ───────────────────────────────────────────────────

/** Body sent by the client to POST /api/agents/chat */
export interface ChatRequest {
  /** Existing conversation to continue. Omit to start a new one. */
  conversationId?: string;
  /** The user's message text. */
  message: string;
  /** Optional hint — if the UI knows which agent the user wants */
  agentHint?: AgentType;
}

// ── Context snapshot (built by lib/agents/context.ts) ───────────────────────

/** A lightweight snapshot of the user's platform data injected into
 *  every agent call so it has real context about the manager's roster. */
export interface UserContext {
  /** ISO timestamp of when this snapshot was built */
  builtAt: string;
  /** Summary text injected verbatim into the system prompt */
  summary: string;
}

// ── Suggested prompts (empty-state UI) ───────────────────────────────────────

export interface SuggestedPrompt {
  label: string;     // Short category label shown above
  text: string;      // Full prompt sent when clicked
  agentHint: AgentType;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: "Contracts",
    text: "Draft a 360 deal memo for a mid-size SA label — I want to understand what I'm agreeing to before I sign anything.",
    agentHint: "contracts",
  },
  {
    label: "Royalties",
    text: "Explain how streaming royalties flow from Spotify to an independent artist signed to a South African distributor.",
    agentHint: "royalties",
  },
  {
    label: "Release Strategy",
    text: "My artist has a new Afrobeats single dropping in 6 weeks. Build me a release timeline with key milestones.",
    agentHint: "releases",
  },
  {
    label: "Marketing",
    text: "What's the best playlist pitching strategy for an emerging Amapiano artist targeting the UK and US markets?",
    agentHint: "marketing",
  },
  {
    label: "Industry",
    text: "Walk me through how a publishing deal works and what rights I should never sign away as a first-time artist.",
    agentHint: "industry",
  },
  {
    label: "Legal",
    text: "What's the difference between a work-for-hire clause and an assignment of copyright in a recording agreement?",
    agentHint: "legal",
  },
];
