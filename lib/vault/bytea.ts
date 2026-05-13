/**
 * Vault bytea helpers
 * ───────────────────
 * Postgres bytea columns are returned by PostgREST (Supabase) as hex strings
 * with a leading "\x" — NOT as Buffer/Uint8Array. Calling `Buffer.from(value)`
 * on those strings treats each character as a byte and produces garbage.
 *
 * Use these helpers anywhere we read bytea values from Supabase and need to
 * forward them to the browser as base64 (or to encrypt/decrypt with them
 * server-side).
 */

export type ByteaValue =
  | string                // PostgREST hex form: "\x4a8b3c..."
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | { type: "Buffer"; data: number[] } // safety net for serialised Buffers
  | null
  | undefined;

/**
 * Convert any bytea value Supabase might hand us back into a Node Buffer.
 * Returns null for null/undefined.
 */
export function byteaToBuffer(b: ByteaValue): Buffer | null {
  if (b == null) return null;

  // PostgREST hex string: "\x" + hex chars
  if (typeof b === "string") {
    if (b.startsWith("\\x")) {
      return Buffer.from(b.slice(2), "hex");
    }
    // Sometimes Supabase sends already base64 (rare for bytea, but defensive)
    return Buffer.from(b, "base64");
  }

  if (Buffer.isBuffer(b)) return b;
  if (b instanceof Uint8Array) return Buffer.from(b);
  if (b instanceof ArrayBuffer) return Buffer.from(new Uint8Array(b));

  // Serialised JSON Buffer ({type:"Buffer",data:[...]}) — rare
  if (typeof b === "object" && (b as { type?: string }).type === "Buffer" && Array.isArray((b as { data: number[] }).data)) {
    return Buffer.from((b as { data: number[] }).data);
  }

  return null;
}

/** Base64-encode a bytea value for sending to the browser. */
export function byteaToBase64(b: ByteaValue): string | null {
  const buf = byteaToBuffer(b);
  return buf ? buf.toString("base64") : null;
}

/**
 * Convert raw bytes (or a base64 string) into the PostgREST bytea hex form
 * "\x<hex>" — required when inserting into bytea columns via supabase-js,
 * because passing a Buffer directly serialises to {"type":"Buffer",...} and
 * gets stored as that literal JSON string.
 */
export function bytesToPgHex(b: Buffer | Uint8Array | string): string {
  if (typeof b === "string") {
    // Treat string as base64
    return "\\x" + Buffer.from(b, "base64").toString("hex");
  }
  if (Buffer.isBuffer(b)) return "\\x" + b.toString("hex");
  return "\\x" + Buffer.from(b).toString("hex");
}

/** Convenience: base64 → "\x<hex>" for direct insert. */
export function base64ToPgHex(s: string): string {
  return "\\x" + Buffer.from(s, "base64").toString("hex");
}
