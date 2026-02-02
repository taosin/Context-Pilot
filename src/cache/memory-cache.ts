/**
 * 内存缓存 - L1 缓存，LRU 策略，最大条目数可配置
 * @see docs/1.md 4.2.3, docs/2.md 10.2.1
 */
import { emit, ContextPilotEventType } from '../events';

export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

const DEFAULT_MAX_ITEMS = 50;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export class MemoryCache {
  private maxItems: number;
  private ttlMs: number;
  private map = new Map<string, CacheEntry<unknown>>();
  private accessOrder: string[] = [];

  constructor(options: { maxItems?: number; ttlMs?: number } = {}) {
    this.maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  }

  get<T>(key: string): T | undefined {
    const entry = this.map.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      emit(ContextPilotEventType.CACHE_MISS, { key });
      return undefined;
    }
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.delete(key);
      emit(ContextPilotEventType.CACHE_MISS, { key });
      return undefined;
    }
    this.touch(key);
    emit(ContextPilotEventType.CACHE_HIT, { key });
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttlMs ?? this.ttlMs);
    if (this.map.has(key)) {
      this.map.set(key, { value, expiresAt });
      this.touch(key);
      return;
    }
    while (this.accessOrder.length >= this.maxItems && this.accessOrder.length > 0) {
      const evictKey = this.accessOrder.shift();
      if (evictKey !== undefined) this.map.delete(evictKey);
    }
    this.map.set(key, { value, expiresAt });
    this.accessOrder.push(key);
  }

  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const existed = this.map.delete(key);
    if (existed) {
      const idx = this.accessOrder.indexOf(key);
      if (idx >= 0) this.accessOrder.splice(idx, 1);
    }
    return existed;
  }

  clear(): void {
    this.map.clear();
    this.accessOrder = [];
  }

  private touch(key: string): void {
    const idx = this.accessOrder.indexOf(key);
    if (idx >= 0) {
      this.accessOrder.splice(idx, 1);
      this.accessOrder.push(key);
    }
  }

  get size(): number {
    return this.map.size;
  }
}
