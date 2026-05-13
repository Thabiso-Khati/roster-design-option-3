/**
 * Unit tests — lib/vault/crypto.ts
 *
 * Run:  npm test
 *
 * Coverage:
 *   • bufToBase64 / base64ToBuf round-trip (empty, small, large, all-255)
 *   • encryptBytes / decryptBytes round-trip
 *   • decryptBytes rejects wrong key (GCM auth tag mismatch)
 *   • encryptString / decryptString round-trip (ASCII + Unicode)
 *   • wrapKey / unwrapKey round-trip
 *   • validateRecoveryPhrase — valid, wrong word count, unknown word
 *   • normaliseRecoveryPhrase — trims, lowercases, collapses whitespace
 *   • encryptFileForVault / decryptFileFromVault end-to-end
 *   • generateRecoveryPhrase — 12 words, all in wordlist, unique per call
 */

import { describe, it, beforeAll, expect } from "vitest";
import {
  bufToBase64,
  base64ToBuf,
  generateAesKey,
  encryptBytes,
  decryptBytes,
  encryptString,
  decryptString,
  wrapKey,
  unwrapKey,
  validateRecoveryPhrase,
  normaliseRecoveryPhrase,
  generateRecoveryPhrase,
  encryptFileForVault,
  decryptFileFromVault,
} from "@/lib/vault/crypto";
import { VAULT_WORDLIST } from "@/lib/vault/wordlist";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Generate n random bytes, chunking to stay within the 65536-byte Web Crypto limit. */
function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  const CHUNK = 65536;
  for (let offset = 0; offset < n; offset += CHUNK) {
    crypto.getRandomValues(buf.subarray(offset, Math.min(offset + CHUNK, n)));
  }
  return buf;
}

// ─── bufToBase64 / base64ToBuf ────────────────────────────────────────────────

describe("bufToBase64 / base64ToBuf", () => {
  it("round-trips an empty buffer", () => {
    const empty = new Uint8Array(0);
    const b64 = bufToBase64(empty);
    expect(b64).toBe("");
    expect(base64ToBuf(b64).length).toBe(0);
  });

  it("round-trips a small buffer", () => {
    const bytes = new Uint8Array([1, 2, 3, 127, 128, 255]);
    const back = base64ToBuf(bufToBase64(bytes));
    expect(back).toEqual(bytes);
  });

  it("round-trips a 1 MB buffer", () => {
    const bytes = randomBytes(1024 * 1024);
    const back = base64ToBuf(bufToBase64(bytes));
    expect(back).toEqual(bytes);
  });

  it("round-trips all-zero buffer", () => {
    const bytes = new Uint8Array(64);
    expect(base64ToBuf(bufToBase64(bytes))).toEqual(bytes);
  });

  it("round-trips all-255 buffer", () => {
    const bytes = new Uint8Array(64).fill(255);
    expect(base64ToBuf(bufToBase64(bytes))).toEqual(bytes);
  });

  it("accepts ArrayBuffer as input", () => {
    const bytes = new Uint8Array([10, 20, 30]);
    const b64 = bufToBase64(bytes.buffer);
    expect(base64ToBuf(b64)).toEqual(bytes);
  });
});

// ─── encryptBytes / decryptBytes ──────────────────────────────────────────────

describe("encryptBytes / decryptBytes", () => {
  let key: CryptoKey;

  beforeAll(async () => { key = await generateAesKey(); });

  it("round-trips a small payload", async () => {
    const plain = new TextEncoder().encode("Hello ROSTER!");
    const { ciphertext, iv } = await encryptBytes(key, plain);
    const back = await decryptBytes(key, ciphertext, iv);
    expect(back).toEqual(plain);
  });

  it("produces different ciphertext each call (fresh IV)", async () => {
    const plain = new TextEncoder().encode("same plaintext");
    const enc1 = await encryptBytes(key, plain);
    const enc2 = await encryptBytes(key, plain);
    expect(enc1.iv).not.toEqual(enc2.iv);
    expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
  });

  it("round-trips an empty payload", async () => {
    const plain = new Uint8Array(0);
    const { ciphertext, iv } = await encryptBytes(key, plain);
    const back = await decryptBytes(key, ciphertext, iv);
    expect(back).toEqual(plain);
  });

  it("round-trips a 512 KB payload", async () => {
    const plain = randomBytes(512 * 1024);
    const { ciphertext, iv } = await encryptBytes(key, plain);
    const back = await decryptBytes(key, ciphertext, iv);
    expect(back).toEqual(plain);
  });

  it("throws on wrong key (GCM auth tag mismatch)", async () => {
    const wrongKey = await generateAesKey();
    const plain = new TextEncoder().encode("secret");
    const { ciphertext, iv } = await encryptBytes(key, plain);
    await expect(decryptBytes(wrongKey, ciphertext, iv)).rejects.toThrow();
  });

  it("throws when IV is tampered", async () => {
    const plain = new TextEncoder().encode("tamper test");
    const { ciphertext, iv } = await encryptBytes(key, plain);
    iv[0] ^= 0xff;
    await expect(decryptBytes(key, ciphertext, iv)).rejects.toThrow();
  });

  it("throws when ciphertext is tampered", async () => {
    const plain = new TextEncoder().encode("tamper ciphertext");
    const { ciphertext, iv } = await encryptBytes(key, plain);
    ciphertext[0] ^= 0xff;
    await expect(decryptBytes(key, ciphertext, iv)).rejects.toThrow();
  });
});

// ─── encryptString / decryptString ───────────────────────────────────────────

describe("encryptString / decryptString", () => {
  let key: CryptoKey;

  beforeAll(async () => { key = await generateAesKey(); });

  it("round-trips ASCII text", async () => {
    const text = "contract-signed-2024.pdf";
    const { ciphertext, iv } = await encryptString(key, text);
    expect(await decryptString(key, ciphertext, iv)).toBe(text);
  });

  it("round-trips Unicode text (emoji + CJK)", async () => {
    const text = "Côte d'Ivoire 🎵 音楽";
    const { ciphertext, iv } = await encryptString(key, text);
    expect(await decryptString(key, ciphertext, iv)).toBe(text);
  });

  it("round-trips an empty string", async () => {
    const { ciphertext, iv } = await encryptString(key, "");
    expect(await decryptString(key, ciphertext, iv)).toBe("");
  });
});

// ─── wrapKey / unwrapKey ──────────────────────────────────────────────────────

describe("wrapKey / unwrapKey", () => {
  it("round-trips a DEK through master key wrap/unwrap", async () => {
    const masterKey = await generateAesKey();
    const dek = await generateAesKey();

    const { ciphertext, iv } = await wrapKey(masterKey, dek);
    const recovered = await unwrapKey(masterKey, ciphertext, iv);

    // Verify the recovered DEK works for encryption
    const plain = new TextEncoder().encode("vault file content");
    const enc = await encryptBytes(recovered, plain);
    const dec = await decryptBytes(recovered, enc.ciphertext, enc.iv);
    expect(dec).toEqual(plain);
  });

  it("unwrapKey fails with wrong master key", async () => {
    const masterKey = await generateAesKey();
    const wrongMaster = await generateAesKey();
    const dek = await generateAesKey();

    const { ciphertext, iv } = await wrapKey(masterKey, dek);
    await expect(unwrapKey(wrongMaster, ciphertext, iv)).rejects.toThrow();
  });
});

// ─── validateRecoveryPhrase ───────────────────────────────────────────────────

describe("validateRecoveryPhrase", () => {
  it("accepts a valid 12-word phrase from the wordlist", () => {
    const words = VAULT_WORDLIST.slice(0, 12).join(" ");
    expect(validateRecoveryPhrase(words)).toEqual({ valid: true });
  });

  it("rejects fewer than 12 words", () => {
    const phrase = VAULT_WORDLIST.slice(0, 5).join(" ");
    const result = validateRecoveryPhrase(phrase);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Expected 12 words/);
  });

  it("rejects more than 12 words", () => {
    const phrase = VAULT_WORDLIST.slice(0, 13).join(" ");
    const result = validateRecoveryPhrase(phrase);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Expected 12 words/);
  });

  it("rejects a phrase with an unknown word", () => {
    const words = [...VAULT_WORDLIST.slice(0, 11), "zzzzunknown"];
    const result = validateRecoveryPhrase(words.join(" "));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Unknown word/);
  });

  it("is case-insensitive (normalises before checking)", () => {
    const words = VAULT_WORDLIST.slice(0, 12).map((w) => w.toUpperCase()).join(" ");
    expect(validateRecoveryPhrase(words)).toEqual({ valid: true });
  });
});

// ─── normaliseRecoveryPhrase ──────────────────────────────────────────────────

describe("normaliseRecoveryPhrase", () => {
  it("lowercases and trims", () => {
    const words = VAULT_WORDLIST.slice(0, 12).map((w) => w.toUpperCase()).join(" ");
    const normalised = normaliseRecoveryPhrase("  " + words + "  ");
    expect(normalised).toBe(VAULT_WORDLIST.slice(0, 12).join(" "));
  });

  it("collapses multiple spaces into one", () => {
    const result = normaliseRecoveryPhrase("word1   word2\t\tword3");
    expect(result).toBe("word1 word2 word3");
  });
});

// ─── generateRecoveryPhrase ───────────────────────────────────────────────────

describe("generateRecoveryPhrase", () => {
  it("generates exactly 12 words", () => {
    const phrase = generateRecoveryPhrase();
    expect(phrase.split(" ").length).toBe(12);
  });

  it("all words are in the wordlist", () => {
    const phrase = generateRecoveryPhrase();
    for (const word of phrase.split(" ")) {
      expect(VAULT_WORDLIST).toContain(word);
    }
  });

  it("produces different phrases on consecutive calls", () => {
    const phrases = new Set(Array.from({ length: 10 }, () => generateRecoveryPhrase()));
    expect(phrases.size).toBeGreaterThan(1);
  });
});

// ─── encryptFileForVault / decryptFileFromVault ───────────────────────────────

describe("encryptFileForVault / decryptFileFromVault", () => {
  let masterKey: CryptoKey;

  beforeAll(async () => { masterKey = await generateAesKey(); });

  it("round-trips a small file with filename and notes", async () => {
    const fileBytes = new TextEncoder().encode("PDF content here");
    const payload = await encryptFileForVault(masterKey, fileBytes, "contract.pdf", "signed copy");

    expect(typeof payload.fileIv).toBe("string");
    expect(typeof payload.wrappedKey).toBe("string");
    expect(typeof payload.nameEncrypted).toBe("string");
    expect(payload.notesEncrypted).not.toBeNull();

    const recovered = await decryptFileFromVault(masterKey, payload.ciphertext, {
      fileIv: payload.fileIv,
      wrappedKey: payload.wrappedKey,
      wrapIv: payload.wrapIv,
    });
    expect(recovered).toEqual(fileBytes);
  });

  it("round-trips with no notes (null notesEncrypted)", async () => {
    const fileBytes = new Uint8Array([0, 1, 2, 3, 255]);
    const payload = await encryptFileForVault(masterKey, fileBytes, "binary.bin");
    expect(payload.notesEncrypted).toBeNull();
    expect(payload.notesIv).toBeNull();

    const recovered = await decryptFileFromVault(masterKey, payload.ciphertext, {
      fileIv: payload.fileIv,
      wrappedKey: payload.wrappedKey,
      wrapIv: payload.wrapIv,
    });
    expect(recovered).toEqual(fileBytes);
  });

  it("fails to decrypt with wrong master key", async () => {
    const wrongMaster = await generateAesKey();
    const fileBytes = new TextEncoder().encode("secret");
    const payload = await encryptFileForVault(masterKey, fileBytes, "file.txt");

    await expect(
      decryptFileFromVault(wrongMaster, payload.ciphertext, {
        fileIv: payload.fileIv,
        wrappedKey: payload.wrappedKey,
        wrapIv: payload.wrapIv,
      })
    ).rejects.toThrow();
  });

  it("round-trips a 1 MB file", async () => {
    const fileBytes = randomBytes(1024 * 1024);
    const payload = await encryptFileForVault(masterKey, fileBytes, "large.bin");
    const recovered = await decryptFileFromVault(masterKey, payload.ciphertext, {
      fileIv: payload.fileIv,
      wrappedKey: payload.wrappedKey,
      wrapIv: payload.wrapIv,
    });
    expect(recovered).toEqual(fileBytes);
  });
});
