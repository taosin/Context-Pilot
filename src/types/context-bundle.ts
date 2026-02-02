/**
 * 上下文包 - 为特定焦点实体收集的相关上下文集合
 * @see docs/2.md 10.1.3
 */
import type { ContextEntity } from './context-entity';

export type ContextLayer = 'core' | 'important' | 'reference';

export interface ContextBundleItem {
  entity: ContextEntity;
  relevanceScore: number;
  inclusionReason: string;
  layer: ContextLayer;
  tokenCount: number;
}

export interface ContextBundleSummary {
  totalTokens: number;
  entitiesByLayer: Record<string, number>;
  primaryRelations: string[];
  estimatedAIQuality: number;
}

export interface ContextBundle {
  id: string;
  focusEntity: ContextEntity;
  contextEntities: ContextBundleItem[];
  summary: ContextBundleSummary;
  timestamp: string;
}

/**
 * 生成上下文包 ID
 */
export function createBundleId(focusEntityId: string): string {
  return `bundle:${focusEntityId}:${Date.now()}`;
}

/**
 * 计算摘要中的各层实体数量
 */
export function computeEntitiesByLayer(items: ContextBundleItem[]): Record<string, number> {
  const byLayer: Record<string, number> = { core: 0, important: 0, reference: 0 };
  for (const item of items) {
    byLayer[item.layer] = (byLayer[item.layer] ?? 0) + 1;
  }
  return byLayer;
}
