/**
 * ROSTER — localStorage utility with 90-day TTL
 *
 * Data is stored alongside a timestamp. On load, if data is older
 * than 90 days it is automatically cleared. This prevents indefinite
 * storage growth while giving subscribers a full quarter of data safety.
 */

const TTL_DAYS = 90;
const TTL_MS   = TTL_DAYS * 24 * 60 * 60 * 1000;

export function storageSave(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export function storageLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Support both new { data, savedAt } format and legacy bare objects
    if (parsed && typeof parsed === "object" && "savedAt" in parsed) {
      if (Date.now() - parsed.savedAt > TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data as T;
    }
    // Legacy format — return as-is and re-save in new format next save
    return parsed as T;
  } catch {
    return null;
  }
}

export function storageClear(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

export const STORAGE_TTL_DAYS = TTL_DAYS;
