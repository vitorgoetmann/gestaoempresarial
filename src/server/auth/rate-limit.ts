import { LRUCache } from "lru-cache";

const limiter = new LRUCache<string, number>({
  max: 5000,
  ttl: 60_000,
});

export function checkRateLimit(key: string, limit = 10): boolean {
  const current = limiter.get(key) ?? 0;
  if (current >= limit) {
    return false;
  }
  limiter.set(key, current + 1);
  return true;
}
