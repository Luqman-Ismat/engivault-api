interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Create a global cache instance for mathematical calculations
export const calculationCache = new SimpleCache<number>(10 * 60 * 1000); // 10 minutes TTL

// Utility function to create cache keys for mathematical calculations
export function createCacheKey(
  prefix: string,
  params: Record<string, number>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}
