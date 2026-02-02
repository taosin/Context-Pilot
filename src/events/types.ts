/**
 * 内部事件类型 - docs/2.md 11.1.1
 */
export enum ContextPilotEventType {
  ANALYSIS_STARTED = 'ANALYSIS_STARTED',
  ENTITY_DISCOVERED = 'ENTITY_DISCOVERED',
  RELATIONSHIP_FOUND = 'RELATIONSHIP_FOUND',
  CONTEXT_REQUESTED = 'CONTEXT_REQUESTED',
  CONTEXT_GENERATED = 'CONTEXT_GENERATED',
  CACHE_HIT = 'CACHE_HIT',
  CACHE_MISS = 'CACHE_MISS',
  AI_RESPONSE_RECEIVED = 'AI_RESPONSE_RECEIVED',
  USER_FEEDBACK = 'USER_FEEDBACK',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
}

export type EventPayloadMap = {
  [ContextPilotEventType.ANALYSIS_STARTED]: { projectRoot: string };
  [ContextPilotEventType.ENTITY_DISCOVERED]: { entityId: string; filePath: string };
  [ContextPilotEventType.RELATIONSHIP_FOUND]: { sourceId: string; targetId: string; type: string };
  [ContextPilotEventType.CONTEXT_REQUESTED]: { focusEntityId: string; filePath: string };
  [ContextPilotEventType.CONTEXT_GENERATED]: { bundleId: string; entityCount: number; totalTokens: number };
  [ContextPilotEventType.CACHE_HIT]: { key: string };
  [ContextPilotEventType.CACHE_MISS]: { key: string };
  [ContextPilotEventType.AI_RESPONSE_RECEIVED]: { requestId: string; accepted: boolean };
  [ContextPilotEventType.USER_FEEDBACK]: { type: 'positive' | 'negative'; context?: string };
  [ContextPilotEventType.ERROR_OCCURRED]: { message: string; code?: string; recoverable: boolean };
  [ContextPilotEventType.PERFORMANCE_METRIC]: { name: string; durationMs: number; metadata?: Record<string, unknown> };
};
