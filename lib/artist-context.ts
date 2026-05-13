/**
 * artist-context.ts
 * ------------------
 * Platform-wide shared context for ROSTER's AI agent.
 * Every tool reads from this — it's the single source of truth
 * about the artist this manager represents.
 *
 * Populated from:
 *   1. Brand Book Builder (primary — STORAGE_KEY below)
 *   2. Manual override fields in each tool
 *   3. Future: Supabase user profile
 */

export const BRAND_BOOK_STORAGE_KEY = "roster_brand_book_v1";

// ─── Core profile type ────────────────────────────────────────────────────────

export interface ArtistContext {
  // Identity
  artistName: string;
  genre: string;
  subGenres?: string[];
  market: string;          // primary market (e.g. "South Africa", "Nigeria")
  markets?: string[];      // additional markets
  careerStage: "emerging" | "developing" | "established" | "major";

  // Brand identity (from Brand Book Builder)
  archetype?: string;      // e.g. "The Auteur", "Street Poet"
  brandVoice?: string[];   // e.g. ["Raw", "Cinematic", "Unapologetic"]
  aesthetic?: string;      // e.g. "Afrofuturist dark editorial"
  audienceAge?: string;    // e.g. "18–28"
  audienceDescription?: string;

  // Releases & achievements
  recentRelease?: string;      // title of most recent release
  releaseDate?: string;        // YYYY-MM-DD
  streamingNumbers?: string;   // e.g. "2.4M monthly Spotify listeners"
  pressHighlights?: string;    // e.g. "Apple Music Africa editorial, OkayAfrica feature"
  playlistFeatures?: string;   // e.g. "Spotify Afrobeats playlist (480k followers)"

  // Contact / business
  managerName?: string;
  managerEmail?: string;
  website?: string;
  instagram?: string;
}

// ─── Loader — reads from Brand Book localStorage ──────────────────────────────

/**
 * Call this in client components only (inside useEffect or event handlers).
 * Returns null if Brand Book hasn't been completed yet.
 */
export function loadArtistContext(): ArtistContext | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(BRAND_BOOK_STORAGE_KEY);
    if (!raw) return null;
    const book = JSON.parse(raw);

    // Map Brand Book fields → ArtistContext
    return {
      artistName:   book.artistName   || "",
      genre:        book.genre        || "",
      market:       book.market       || "",
      markets:      book.markets      || [],
      careerStage:  mapCareerStage(book.careerStage),
      archetype:    book.archetype    || undefined,
      brandVoice:   book.moodWords    || [],
      aesthetic:    book.aesthetic    || undefined,
      audienceAge:  book.audienceAge  || undefined,
      audienceDescription: book.audienceDescription || undefined,
      recentRelease: book.recentRelease || undefined,
      releaseDate:   book.releaseDate  || undefined,
    };
  } catch {
    return null;
  }
}

/** Save an updated context back to localStorage (merges with existing) */
export function saveArtistContext(updates: Partial<ArtistContext>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadArtistContext() || {};
    const merged = { ...existing, ...updates };
    // Write back under a dedicated key (separate from Brand Book)
    localStorage.setItem("roster_artist_context_v1", JSON.stringify(merged));
  } catch {}
}

/** Load from dedicated context key, falling back to Brand Book */
export function loadFullContext(): ArtistContext | null {
  if (typeof window === "undefined") return null;
  try {
    const dedicated = localStorage.getItem("roster_artist_context_v1");
    if (dedicated) return JSON.parse(dedicated);
    return loadArtistContext();
  } catch {
    return null;
  }
}

// ─── Prompt formatter — used by API route to inject context ───────────────────

/**
 * Formats ArtistContext into a compact string for AI system prompts.
 * Every tool injects this at the top of its system prompt.
 */
export function formatContextForPrompt(ctx: ArtistContext): string {
  const lines: string[] = [
    `Artist: ${ctx.artistName}`,
    `Genre: ${ctx.genre}`,
    `Primary market: ${ctx.market}`,
    `Career stage: ${ctx.careerStage}`,
  ];
  if (ctx.archetype)     lines.push(`Brand archetype: ${ctx.archetype}`);
  if (ctx.brandVoice?.length) lines.push(`Brand voice: ${ctx.brandVoice.join(", ")}`);
  if (ctx.aesthetic)     lines.push(`Visual aesthetic: ${ctx.aesthetic}`);
  if (ctx.audienceDescription) lines.push(`Core audience: ${ctx.audienceDescription}`);
  if (ctx.recentRelease) lines.push(`Recent release: "${ctx.recentRelease}"${ctx.releaseDate ? ` (${ctx.releaseDate})` : ""}`);
  if (ctx.streamingNumbers)  lines.push(`Streaming: ${ctx.streamingNumbers}`);
  if (ctx.pressHighlights)   lines.push(`Press: ${ctx.pressHighlights}`);
  if (ctx.playlistFeatures)  lines.push(`Playlist features: ${ctx.playlistFeatures}`);
  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapCareerStage(raw: string | undefined): ArtistContext["careerStage"] {
  const map: Record<string, ArtistContext["careerStage"]> = {
    emerging:    "emerging",
    developing:  "developing",
    established: "established",
    major:       "major",
    // Brand Book may use different labels
    "just starting": "emerging",
    "growing":       "developing",
    "breaking":      "developing",
  };
  return map[raw?.toLowerCase() ?? ""] ?? "developing";
}

export const CAREER_STAGE_LABELS: Record<ArtistContext["careerStage"], string> = {
  emerging:    "Emerging (0–10k monthly listeners)",
  developing:  "Developing (10k–500k monthly listeners)",
  established: "Established (500k–5M monthly listeners)",
  major:       "Major (5M+ monthly listeners)",
};
