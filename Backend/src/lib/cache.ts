import { redis } from "./redis";

const CACHE_TTL_SECONDS = 60;

export const cacheKeys = {
  borrowerList: (userId: string) => `cache:${userId}:borrowers`,
  borrowerDetail: (userId: string, borrowerId: string) => `cache:${userId}:borrower:${borrowerId}`,
  notes: (userId: string) => `cache:${userId}:notes`
};

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    await redis.del(key);
    return null;
  }
}

export function setCachedJson(key: string, value: unknown) {
  return redis.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
}

export function clearCacheKeys(...keys: string[]) {
  return Promise.all(keys.map((key) => redis.del(key)));
}
