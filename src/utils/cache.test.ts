import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleCache, calculationCache, createCacheKey } from './cache';

describe('SimpleCache', () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    cache = new SimpleCache<string>(1000); // 1 second TTL for testing
  });

  it('should store and retrieve values', () => {
    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('non-existent')).toBeNull();
  });

  it('should expire values after TTL', async () => {
    cache.set('expire-test', 'expire-value', 100); // 100ms TTL
    expect(cache.get('expire-test')).toBe('expire-value');

    await new Promise(resolve => setTimeout(resolve, 150)); // Wait for expiration
    expect(cache.get('expire-test')).toBeNull();
  });

  it('should clear all values', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should return correct size', () => {
    expect(cache.size()).toBe(0);
    cache.set('key1', 'value1');
    expect(cache.size()).toBe(1);
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);
  });
});

describe('createCacheKey', () => {
  it('should create consistent keys for same parameters', () => {
    const params1 = { a: 1, b: 2, c: 3 };
    const params2 = { c: 3, a: 1, b: 2 };

    const key1 = createCacheKey('test', params1);
    const key2 = createCacheKey('test', params2);

    expect(key1).toBe(key2);
  });

  it('should create different keys for different parameters', () => {
    const params1 = { a: 1, b: 2 };
    const params2 = { a: 1, b: 3 };

    const key1 = createCacheKey('test', params1);
    const key2 = createCacheKey('test', params2);

    expect(key1).not.toBe(key2);
  });

  it('should include prefix in key', () => {
    const params = { a: 1, b: 2 };
    const key = createCacheKey('reynolds', params);

    expect(key).toContain('reynolds');
  });
});

describe('calculationCache', () => {
  beforeEach(() => {
    calculationCache.clear();
  });

  it('should be a global cache instance', () => {
    expect(calculationCache).toBeInstanceOf(SimpleCache);
  });

  it('should store and retrieve calculation results', () => {
    calculationCache.set('test-calc', 42);
    expect(calculationCache.get('test-calc')).toBe(42);
  });
});
