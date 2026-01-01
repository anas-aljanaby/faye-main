// Simple in-memory cache with TTL (Time To Live)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear cache entries that match a pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new Cache();

// Cache key generators
export const getCacheKey = {
  orphans: (orgId: string, userId?: string, role?: string) => 
    `orphans:${orgId}:${userId || ''}:${role || ''}`,
  sponsors: (orgId: string) => `sponsors:${orgId}`,
  teamMembers: (orgId: string) => `teamMembers:${orgId}`,
  orphanDetails: (orphanId: string) => `orphanDetails:${orphanId}`,
  financialTransactions: (orgId: string) => `financialTransactions:${orgId}`,
  conversations: (orgId: string, userId: string) => `conversations:${orgId}:${userId}`,
  messages: (conversationId: string) => `messages:${conversationId}`,
  occasions: (orgId: string, userId?: string, role?: string) => 
    `occasions:${orgId}:${userId || ''}:${role || ''}`,
};

