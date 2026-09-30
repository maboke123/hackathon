import "server-only";
import { headers } from "next/headers";

type Entry = { count: number; resetAt: number };

const MAX_ENTRIES = 10_000;

// In memory: resets on restart and assumes a single app container.
const globalForLimits = globalThis as typeof globalThis & {
  __rateLimits?: Map<string, Entry>;
};
const entries = (globalForLimits.__rateLimits ??= new Map<string, Entry>());

function removeExpired(now: number) {
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
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
      const entry = entries.get(keyFor(key));
      if (entry && entry.resetAt > now) {
        entry.count += 1;
        return;
      }
      if (entries.size >= MAX_ENTRIES) {
        removeExpired(now);
      }
      entries.set(keyFor(key), { count: 1, resetAt: now + windowMs });
    },
    reset(key: string): void {
      entries.delete(keyFor(key));
    },
  };
}

export async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}
