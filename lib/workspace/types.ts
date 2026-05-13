// ============================================================
// ROSTER — Workspace event types (Phase 2 foundation)
// ------------------------------------------------------------
// Shared types between the client tracking hook, the
// /api/workspace/events route, and the dashboard aggregation.
//
// Keep the two unions below in sync with the SQL CHECK
// constraints in migration 020. TypeScript will enforce
// the type at compile time; the DB enforces at runtime.
// ============================================================

export type ArtifactType =
  | "tool" // calculators, planners (Album Budget, Tour Budget, ...)
  | "form" // fillable templates
  | "checklist" // multi-step interactive checklist
  | "contract" // contract template being filled in
  | "release" // planned release (server-backed in `releases` table)
  | "contact" // a person in the contacts module
  | "booking" // a tour/show booking
  | "agreement"; // signed agreement/document

export type EventType =
  | "opened"
  | "edited"
  | "completed"
  | "dismissed"
  | "reopened";

export interface WorkspaceEvent {
  id: string;
  userId: string;
  artifactType: ArtifactType;
  artifactId: string;
  artifactLabel: string | null;
  eventType: EventType;
  completionPct: number | null; // 0..1
  metadata: Record<string, unknown> | null;
  occurredAt: string; // ISO
}

/** Payload accepted by POST /api/workspace/events. */
export interface WorkspaceEventPayload {
  artifactType: ArtifactType;
  artifactId: string;
  artifactLabel?: string | null;
  eventType: EventType;
  completionPct?: number | null;
  metadata?: Record<string, unknown> | null;
}

/** Allowed values per the SQL CHECK constraints — used for runtime
 *  validation in the API route. Must match the unions above. */
export const ARTIFACT_TYPES: readonly ArtifactType[] = [
  "tool",
  "form",
  "checklist",
  "contract",
  "release",
  "contact",
  "booking",
  "agreement",
] as const;

export const EVENT_TYPES: readonly EventType[] = [
  "opened",
  "edited",
  "completed",
  "dismissed",
  "reopened",
] as const;

export function isArtifactType(v: unknown): v is ArtifactType {
  return typeof v === "string" && (ARTIFACT_TYPES as readonly string[]).includes(v);
}

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && (EVENT_TYPES as readonly string[]).includes(v);
}
