/**
 * 事件总线单元测试 - docs/2.md 11.1
 */
import * as assert from 'assert';
import { on, emit, removeAllListeners, ContextPilotEventType } from '../../src/events';

describe('EventBus', () => {
  afterEach(() => {
    removeAllListeners();
  });

  it('on + emit 能触发监听器', () => {
    let received: string | null = null;
    const unsub = on(ContextPilotEventType.CACHE_HIT, (p) => {
      received = p.key;
    });
    emit(ContextPilotEventType.CACHE_HIT, { key: 'test-key' });
    assert.strictEqual(received, 'test-key');
    unsub();
  });

  it('取消订阅后不再收到事件', () => {
    let count = 0;
    const unsub = on(ContextPilotEventType.CACHE_MISS, () => {
      count++;
    });
    emit(ContextPilotEventType.CACHE_MISS, { key: 'a' });
    unsub();
    emit(ContextPilotEventType.CACHE_MISS, { key: 'b' });
    assert.strictEqual(count, 1);
  });

  it('removeAllListeners 后无监听器被调用', () => {
    let count = 0;
    on(ContextPilotEventType.ENTITY_DISCOVERED, () => count++);
    removeAllListeners();
    emit(ContextPilotEventType.ENTITY_DISCOVERED, { entityId: 'e1', filePath: '/f' });
    assert.strictEqual(count, 0);
  });
});
