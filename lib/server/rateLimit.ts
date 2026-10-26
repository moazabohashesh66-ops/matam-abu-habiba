import { isIP } from "node:net";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const entries = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 5000;

function getClientAddress(request: Request) {
  // Trust only Vercel's edge-provided header. Generic forwarded headers can be
  // supplied by a caller on deployments that do not overwrite them.
  const forwarded = request.headers.get("x-vercel-forwarded-for");
  const candidates = forwarded?.split(",").map((value) => value.trim()).reverse() ?? [];
  return candidates.find((value) => isIP(value) !== 0) ?? "unknown";
}

function bucketKey(request: Request, scope: string) {
  return `${scope}:${getClientAddress(request)}`;
}

function pruneEntries(now: number) {
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) entries.delete(key);
  }
  while (entries.size >= MAX_ENTRIES) {
    const oldestKey = entries.keys().next().value;
    if (oldestKey === undefined) break;
    entries.delete(oldestKey);
  }
}

export function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  // Local development proxies collapse clients into a single "unknown" address.
  // Keep the limiter for production deployments, where Vercel supplies a trusted IP.
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  const key = bucketKey(request, scope);
  const current = entries.get(key);

  if (!current || current.resetAt <= now) {
    if (entries.size >= MAX_ENTRIES) pruneEntries(now);
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(request: Request, scope: string) {
  entries.delete(bucketKey(request, scope));
}
