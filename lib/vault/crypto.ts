/**
 * Vault crypto module — runs ENTIRELY in the browser.
 *
 * Uses the Web Crypto API:
 *   • AES-GCM 256-bit for symmetric encryption (file ciphertext + key wraps)
 *   • PBKDF2-SHA-256, 600,000 iterations for password / recovery-phrase key derivation
 *   • SHA-256 for misc hashing
 *
 * Security model:
 *   • Master key (M) — 256-bit random, generated once at vault init.
 *   • Per-file Data Encryption Key (DEK) — 256-bit random, fresh per file.
 *     File ciphertext = AES-GCM(file, DEK, fileIV)
 *     wrappedKey     = AES-GCM(DEK, M, wrapIV)
 *   • Master key wrapped two ways at vault_user_keys:
 *     master_key_encrypted          = AES-GCM(M, KP, masterKeyIV) where KP = PBKDF2(password, salt, 600k)
 *     recovery_master_key_encrypted = AES-GCM(M, KR, recoveryIV)  where KR = PBKDF2(recoveryPhrase, salt, 600k)
 *   • Server never sees plaintext: not the password, not the recovery phrase, not M, not any DEK, not any file content.
 *
 * Browser-only: uses globalThis.crypto.subtle. Will throw if imported server-side.
 */

import { VAULT_WORDLIST } from "./wordlist";

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH_BITS = 256;
const IV_LENGTH_BYTES = 12; // 96 bits per AES-GCM spec
const SALT_LENGTH_BYTES = 16;
const RECOVERY_PHRASE_WORDS = 12;

// ─── encoding helpers ──────────────────────────────────────────────────
export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuf(s: string): Uint8Array {
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

// ─── primitives ────────────────────────────────────────────────────────
function getSubtle(): SubtleCrypto {
  if (typeof globalThis === "undefined" || !globalThis.crypto?.subtle) {
    throw new Error("Vault crypto requires a browser Web Crypto API context.");
  }
  return globalThis.crypto.subtle;
}

function randomBytes(len: number): Uint8Array {
  const out = new Uint8Array(len);
  globalThis.crypto.getRandomValues(out);
  return out;
}

/** Generate a fresh 256-bit AES-GCM key (master or DEK). */
export async function generateAesKey(): Promise<CryptoKey> {
  return getSubtle().generateKey(
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    true, // extractable — needed so we can wrap and re-import
    ["encrypt", "decrypt"]
  );
}

/** Export an AES key as raw bytes (for wrapping). */
export async function exportRawKey(key: CryptoKey): Promise<Uint8Array> {
  const buf = await getSubtle().exportKey("raw", key);
  return new Uint8Array(buf);
}

/** Import raw bytes back as an AES-GCM key. */
export async function importRawKey(raw: Uint8Array): Promise<CryptoKey> {
  return getSubtle().importKey(
    "raw",
    raw as BufferSource,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    true,
    ["encrypt", "decrypt"]
  );
}

/** Derive an AES-GCM key from a password / recovery phrase via PBKDF2. */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const baseKey = await getSubtle().importKey(
    "raw",
    TEXT_ENCODER.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return getSubtle().deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    true,
    ["encrypt", "decrypt"]
  );
}

// ─── encrypt / decrypt ─────────────────────────────────────────────────
export interface EncryptedBlob {
  ciphertext: Uint8Array;
  iv: Uint8Array;
}

/** Encrypt arbitrary bytes with AES-GCM. */
export async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<EncryptedBlob> {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = await getSubtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return { ciphertext: new Uint8Array(cipher), iv };
}

/** Decrypt AES-GCM ciphertext. Throws on tag failure / wrong key. */
export async function decryptBytes(
  key: CryptoKey,
  ciphertext: Uint8Array,
  iv: Uint8Array,
): Promise<Uint8Array> {
  const plain = await getSubtle().decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new Uint8Array(plain);
}

/** Encrypt a string (UTF-8) — used for filenames + notes. */
export async function encryptString(key: CryptoKey, plaintext: string): Promise<EncryptedBlob> {
  return encryptBytes(key, TEXT_ENCODER.encode(plaintext));
}

/** Decrypt a string. */
export async function decryptString(key: CryptoKey, ciphertext: Uint8Array, iv: Uint8Array): Promise<string> {
  const bytes = await decryptBytes(key, ciphertext, iv);
  return TEXT_DECODER.decode(bytes);
}

/** Wrap a DEK with the master key (just an encryptBytes of the raw DEK). */
export async function wrapKey(masterKey: CryptoKey, dek: CryptoKey): Promise<EncryptedBlob> {
  const raw = await exportRawKey(dek);
  return encryptBytes(masterKey, raw);
}

/** Unwrap a wrapped DEK back to a usable CryptoKey. */
export async function unwrapKey(masterKey: CryptoKey, wrapped: Uint8Array, iv: Uint8Array): Promise<CryptoKey> {
  const raw = await decryptBytes(masterKey, wrapped, iv);
  return importRawKey(raw);
}

// ─── recovery phrase ───────────────────────────────────────────────────

/** Generate a random 12-word recovery phrase from the curated wordlist. */
export function generateRecoveryPhrase(): string {
  const indices = randomBytes(RECOVERY_PHRASE_WORDS);
  const words: string[] = [];
  for (let i = 0; i < RECOVERY_PHRASE_WORDS; i++) {
    words.push(VAULT_WORDLIST[indices[i] % VAULT_WORDLIST.length]);
  }
  return words.join(" ");
}

/** Validate a typed recovery phrase: 12 words, all in the wordlist. */
export function validateRecoveryPhrase(phrase: string): { valid: boolean; reason?: string } {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  if (words.length !== RECOVERY_PHRASE_WORDS) {
    return { valid: false, reason: `Expected ${RECOVERY_PHRASE_WORDS} words, got ${words.length}.` };
  }
  for (const w of words) {
    if (!VAULT_WORDLIST.includes(w)) {
      return { valid: false, reason: `Unknown word: "${w}"` };
    }
  }
  return { valid: true };
}

/** Normalise a phrase before deriving a key (lowercase, single spaces). */
export function normaliseRecoveryPhrase(phrase: string): string {
  return phrase.trim().toLowerCase().split(/\s+/).join(" ");
}

// ─── high-level vault ops ──────────────────────────────────────────────

export interface VaultInitResult {
  /** What to POST to /api/vault/init (all values base64). */
  payload: {
    masterKeyEncrypted: string;
    masterKeyIv: string;
    masterKeySalt: string;
    masterKeyIterations: number;
    recoveryMasterKeyEncrypted: string;
    recoveryMasterKeyIv: string;
    recoveryMasterKeySalt: string;
  };
  /** The 12-word phrase — display ONCE to the user, never persist. */
  recoveryPhrase: string;
  /** The unwrapped master key, kept in sessionStorage for the unlocked session. */
  masterKey: CryptoKey;
}

/** Set up a new vault: generate M, wrap with password and recovery, return init payload. */
export async function initVault(password: string): Promise<VaultInitResult> {
  const masterKey = await generateAesKey();
  const masterKeyRaw = await exportRawKey(masterKey);

  // Password wrap
  const masterSalt = randomBytes(SALT_LENGTH_BYTES);
  const passwordKey = await deriveKeyFromPassphrase(password, masterSalt);
  const masterEncrypted = await encryptBytes(passwordKey, masterKeyRaw);

  // Recovery wrap
  const recoveryPhrase = generateRecoveryPhrase();
  const recoverySalt = randomBytes(SALT_LENGTH_BYTES);
  const recoveryKey = await deriveKeyFromPassphrase(normaliseRecoveryPhrase(recoveryPhrase), recoverySalt);
  const recoveryEncrypted = await encryptBytes(recoveryKey, masterKeyRaw);

  return {
    payload: {
      masterKeyEncrypted: bufToBase64(masterEncrypted.ciphertext),
      masterKeyIv: bufToBase64(masterEncrypted.iv),
      masterKeySalt: bufToBase64(masterSalt),
      masterKeyIterations: PBKDF2_ITERATIONS,
      recoveryMasterKeyEncrypted: bufToBase64(recoveryEncrypted.ciphertext),
      recoveryMasterKeyIv: bufToBase64(recoveryEncrypted.iv),
      recoveryMasterKeySalt: bufToBase64(recoverySalt),
    },
    recoveryPhrase,
    masterKey,
  };
}

/**
 * Unlock the vault with a password.
 * Throws if password is wrong (caller should catch and show "wrong password").
 */
export async function unlockVaultWithPassword(
  password: string,
  wrappedKeys: {
    masterKeyEncrypted: string;
    masterKeyIv: string;
    masterKeySalt: string;
    masterKeyIterations: number;
  },
): Promise<CryptoKey> {
  const passwordKey = await deriveKeyFromPassphrase(
    password,
    base64ToBuf(wrappedKeys.masterKeySalt),
    wrappedKeys.masterKeyIterations,
  );
  const masterRaw = await decryptBytes(
    passwordKey,
    base64ToBuf(wrappedKeys.masterKeyEncrypted),
    base64ToBuf(wrappedKeys.masterKeyIv),
  );
  return importRawKey(masterRaw);
}

/** Unlock the vault with the recovery phrase. */
export async function unlockVaultWithRecovery(
  recoveryPhrase: string,
  wrappedKeys: {
    recoveryMasterKeyEncrypted: string;
    recoveryMasterKeyIv: string;
    recoveryMasterKeySalt: string;
  },
): Promise<CryptoKey> {
  const recoveryKey = await deriveKeyFromPassphrase(
    normaliseRecoveryPhrase(recoveryPhrase),
    base64ToBuf(wrappedKeys.recoveryMasterKeySalt),
  );
  const masterRaw = await decryptBytes(
    recoveryKey,
    base64ToBuf(wrappedKeys.recoveryMasterKeyEncrypted),
    base64ToBuf(wrappedKeys.recoveryMasterKeyIv),
  );
  return importRawKey(masterRaw);
}

/** Re-wrap the master key with a new password. Caller POSTs to /rotate-password. */
export async function rotatePasswordPayload(
  masterKey: CryptoKey,
  newPassword: string,
): Promise<{
  masterKeyEncrypted: string;
  masterKeyIv: string;
  masterKeySalt: string;
  masterKeyIterations: number;
}> {
  const masterRaw = await exportRawKey(masterKey);
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const passwordKey = await deriveKeyFromPassphrase(newPassword, salt);
  const enc = await encryptBytes(passwordKey, masterRaw);
  return {
    masterKeyEncrypted: bufToBase64(enc.ciphertext),
    masterKeyIv: bufToBase64(enc.iv),
    masterKeySalt: bufToBase64(salt),
    masterKeyIterations: PBKDF2_ITERATIONS,
  };
}

/** Re-wrap the master key with a new recovery phrase. */
export async function rotateRecoveryPayload(
  masterKey: CryptoKey,
): Promise<{
  recoveryPhrase: string;
  payload: {
    recoveryMasterKeyEncrypted: string;
    recoveryMasterKeyIv: string;
    recoveryMasterKeySalt: string;
  };
}> {
  const masterRaw = await exportRawKey(masterKey);
  const recoveryPhrase = generateRecoveryPhrase();
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const recoveryKey = await deriveKeyFromPassphrase(normaliseRecoveryPhrase(recoveryPhrase), salt);
  const enc = await encryptBytes(recoveryKey, masterRaw);
  return {
    recoveryPhrase,
    payload: {
      recoveryMasterKeyEncrypted: bufToBase64(enc.ciphertext),
      recoveryMasterKeyIv: bufToBase64(enc.iv),
      recoveryMasterKeySalt: bufToBase64(salt),
    },
  };
}

// ─── per-file flow ─────────────────────────────────────────────────────

export interface EncryptedFilePayload {
  ciphertext: Uint8Array;       // upload this to Storage
  fileIv: string;                // base64 — POST to /items
  wrappedKey: string;            // base64 — POST to /items
  wrapIv: string;                // base64 — POST to /items
  nameEncrypted: string;         // base64
  nameIv: string;                // base64
  notesEncrypted: string | null; // base64 or null
  notesIv: string | null;
}

/** Encrypt a file + name (+optional notes) under a fresh DEK wrapped by master key. */
export async function encryptFileForVault(
  masterKey: CryptoKey,
  fileBytes: Uint8Array,
  filename: string,
  notes?: string | null,
): Promise<EncryptedFilePayload> {
  const dek = await generateAesKey();

  // Encrypt file
  const fileEnc = await encryptBytes(dek, fileBytes);

  // Wrap DEK with master key
  const wrap = await wrapKey(masterKey, dek);

  // Encrypt filename
  const nameEnc = await encryptString(masterKey, filename);

  // Encrypt notes (optional)
  let notesEncrypted: string | null = null;
  let notesIv: string | null = null;
  if (notes && notes.trim().length) {
    const ne = await encryptString(masterKey, notes);
    notesEncrypted = bufToBase64(ne.ciphertext);
    notesIv = bufToBase64(ne.iv);
  }

  return {
    ciphertext: fileEnc.ciphertext,
    fileIv: bufToBase64(fileEnc.iv),
    wrappedKey: bufToBase64(wrap.ciphertext),
    wrapIv: bufToBase64(wrap.iv),
    nameEncrypted: bufToBase64(nameEnc.ciphertext),
    nameIv: bufToBase64(nameEnc.iv),
    notesEncrypted,
    notesIv,
  };
}

/** Decrypt a file the client just downloaded from Storage. */
export async function decryptFileFromVault(
  masterKey: CryptoKey,
  ciphertext: Uint8Array,
  metadata: {
    fileIv: string;
    wrappedKey: string;
    wrapIv: string;
  },
): Promise<Uint8Array> {
  const dek = await unwrapKey(masterKey, base64ToBuf(metadata.wrappedKey), base64ToBuf(metadata.wrapIv));
  return decryptBytes(dek, ciphertext, base64ToBuf(metadata.fileIv));
}

/** Decrypt the filename for an item-list row. */
export async function decryptItemName(
  masterKey: CryptoKey,
  nameEncrypted: string,
  nameIv: string,
): Promise<string> {
  return decryptString(masterKey, base64ToBuf(nameEncrypted), base64ToBuf(nameIv));
}

/** Decrypt notes for an item (returns empty string if absent). */
export async function decryptItemNotes(
  masterKey: CryptoKey,
  notesEncrypted: string | null,
  notesIv: string | null,
): Promise<string> {
  if (!notesEncrypted || !notesIv) return "";
  return decryptString(masterKey, base64ToBuf(notesEncrypted), base64ToBuf(notesIv));
}
