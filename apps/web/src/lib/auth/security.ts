import { createHash, randomBytes } from "crypto";

const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

interface FailedAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

// In-memory store — replace with Redis in production
const failedAttempts = new Map<string, FailedAttempt>();

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const existing = failedAttempts.get(identifier);

  if (!existing || now - existing.firstAttemptAt > BRUTE_FORCE_WINDOW_MS) {
    failedAttempts.set(identifier, { count: 1, firstAttemptAt: now });
    return;
  }

  const updated = { ...existing, count: existing.count + 1 };

  if (updated.count >= MAX_FAILED_ATTEMPTS) {
    updated.lockedUntil = now + BRUTE_FORCE_WINDOW_MS;
  }

  failedAttempts.set(identifier, updated);
}

export function clearFailedLogins(identifier: string): void {
  failedAttempts.delete(identifier);
}

export function isAccountLocked(identifier: string): boolean {
  const record = failedAttempts.get(identifier);
  if (!record?.lockedUntil) return false;

  if (Date.now() > record.lockedUntil) {
    failedAttempts.delete(identifier);
    return false;
  }

  return true;
}

export function getLockoutRemainingMs(identifier: string): number {
  const record = failedAttempts.get(identifier);
  if (!record?.lockedUntil) return 0;
  return Math.max(0, record.lockedUntil - Date.now());
}

/** Rotate a session token — invalidates the old one and returns a new token. */
export function rotateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash a token for safe storage (e.g., storing session tokens in DB). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison to prevent timing attacks. */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i]! ^ bufB[i]!;
  }
  return diff === 0;
}
