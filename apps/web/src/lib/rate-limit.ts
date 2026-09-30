import "server-only";
import { headers } from "next/headers";

type Entry = { count: number; resetAt: number };

const MAX_ENTRIES = 10_000;

// In memory: resets on restart and assumes a single app container.
const globalForLimits = globalThis as typeof globalThis & {
  __rateLimits?: Map<string, Entry>;
};
const entries = (globalForLimits.__rateLimits ??= new Map<string, Entry>());

function makeRoom(now: number) {
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
  }
  // Maps iterate in insertion order, so this drops the oldest windows first.
  for (const key of entries.keys()) {
    if (entries.size < MAX_ENTRIES) {
      return;
    }
    entries.delete(key);
  }
}

export function createRateLimit(name: string, max: number, windowMs: number) {
  const keyFor = (key: string) => `${name}:${key.toLowerCase()}`;

  return {
    isLimited(key: string): boolean {
      const entry = entries.get(keyFor(key));
      return (
        entry !== undefined && entry.resetAt > Date.now() && entry.count >= max
      );
    },
    hit(key: string): void {
      const now = Date.now();
      const entryKey = keyFor(key);
      const entry = entries.get(entryKey);
      if (entry && entry.resetAt > now) {
        entry.count += 1;
        return;
      }
      entries.delete(entryKey);
      if (entries.size >= MAX_ENTRIES) {
        makeRoom(now);
      }
      entries.set(entryKey, { count: 1, resetAt: now + windowMs });
    },
    reset(key: string): void {
      entries.delete(keyFor(key));
    },
  };
}

// The reverse proxy appends the real client address, so read the last entry.
// Earlier entries come from the client and can be forged.
export async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}
