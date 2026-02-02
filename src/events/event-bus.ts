/**
 * 内部事件总线 - docs/2.md 11.1
 */
import { ContextPilotEventType, type EventPayloadMap } from './types';

export type EventListener<T extends ContextPilotEventType> = (payload: EventPayloadMap[T]) => void;

const listeners = new Map<ContextPilotEventType, Set<EventListener<ContextPilotEventType>>>();

function getListeners(type: ContextPilotEventType): Set<EventListener<ContextPilotEventType>> {
  let set = listeners.get(type);
  if (!set) {
    set = new Set();
    listeners.set(type, set);
  }
  return set;
}

/**
 * 订阅事件
 */
export function on<T extends ContextPilotEventType>(type: T, listener: EventListener<T>): () => void {
  const set = getListeners(type);
  set.add(listener as EventListener<ContextPilotEventType>);
  return () => set.delete(listener as EventListener<ContextPilotEventType>);
}

/**
 * 发布事件
 */
export function emit<T extends ContextPilotEventType>(type: T, payload: EventPayloadMap[T]): void {
  const set = listeners.get(type);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch (err) {
      console.error(`[Context Pilot] Event listener error for ${type}:`, err);
    }
  }
}

/**
 * 清除所有监听器（用于测试或卸载）
 */
export function removeAllListeners(): void {
  listeners.clear();
}

export { ContextPilotEventType };
