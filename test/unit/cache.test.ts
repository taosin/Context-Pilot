/**
 * 内存缓存单元测试 - docs/1.md 4.2.3, 7.1
 */
import * as assert from 'assert';
import { MemoryCache } from '../../src/cache/memory-cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ maxItems: 3, ttlMs: 1000 });
  });

  it('set 后 get 能取回值', () => {
    cache.set('a', 1);
    assert.strictEqual(cache.get<number>('a'), 1);
  });

  it('未设置的 key 返回 undefined', () => {
    assert.strictEqual(cache.get('x'), undefined);
  });

  it('LRU 淘汰：超过 maxItems 时淘汰最久未访问', () => {
    cache.set('1', 1);
    cache.set('2', 2);
    cache.set('3', 3);
    cache.get('1');
    cache.set('4', 4);
    assert.strictEqual(cache.get('2'), undefined);
    assert.strictEqual(cache.get('1'), 1);
    assert.strictEqual(cache.get('3'), 3);
    assert.strictEqual(cache.get('4'), 4);
  });

  it('has 对存在的 key 返回 true', () => {
    cache.set('k', 1);
    assert.strictEqual(cache.has('k'), true);
  });

  it('delete 后 has 返回 false，get 返回 undefined', () => {
    cache.set('k', 1);
    cache.delete('k');
    assert.strictEqual(cache.has('k'), false);
    assert.strictEqual(cache.get('k'), undefined);
  });

  it('clear 后 size 为 0', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    assert.strictEqual(cache.size, 0);
    assert.strictEqual(cache.get('a'), undefined);
  });
});
