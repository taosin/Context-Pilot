/**
 * 上下文智能组装器 - 对候选实体评分、分层并生成 ContextBundle
 * @see docs/1.md 2.1.2, 4.2.1
 */
import type { ContextEntity } from '../types/context-entity';
import type { ContextBundle, ContextBundleItem, ContextLayer } from '../types/context-bundle';
import type { RelationshipEdge } from '../types/relationship-edge';
import { createBundleId, computeEntitiesByLayer } from '../types/context-bundle';
import type { ContextPilotConfig } from '../config/types';

/** 粗略估算：英文/代码约 4 字符 1 token */
const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export interface AssemblerInput {
  focusEntity: ContextEntity;
  entities: ContextEntity[];
  relationships: RelationshipEdge[];
  config: ContextPilotConfig;
}

interface ScoredCandidate {
  entity: ContextEntity;
  relevanceScore: number;
  inclusionReason: string;
  layer: ContextLayer;
}

function scoreAndLayer(
  focusEntity: ContextEntity,
  entities: ContextEntity[],
  relationships: RelationshipEdge[],
  config: ContextPilotConfig
): ScoredCandidate[] {
  const directCallees = new Set<string>();
  const directCallers = new Set<string>();
  const indirect = new Set<string>();
  for (const r of relationships) {
    if (r.sourceId === focusEntity.id) directCallees.add(r.targetId);
    else if (r.targetId === focusEntity.id) directCallers.add(r.sourceId);
  }
  for (const r of relationships) {
    if (r.sourceId !== focusEntity.id && r.targetId !== focusEntity.id) {
      if (directCallees.has(r.sourceId) || directCallees.has(r.targetId) ||
          directCallers.has(r.sourceId) || directCallers.has(r.targetId)) {
        indirect.add(r.sourceId);
        indirect.add(r.targetId);
      }
    }
  }

  const candidates: ScoredCandidate[] = [];
  for (const entity of entities) {
    if (entity.id === focusEntity.id) continue;
    let relevanceScore = 0;
    let inclusionReason = '';
    let layer: ContextLayer = 'reference';

    if (directCallees.has(entity.id) || directCallers.has(entity.id)) {
      relevanceScore = 95;
      inclusionReason = directCallees.has(entity.id) ? '被当前焦点调用' : '调用当前焦点';
      layer = 'core';
    } else if (indirect.has(entity.id)) {
      relevanceScore = 70;
      inclusionReason = '与焦点存在间接依赖';
      layer = 'important';
    } else {
      relevanceScore = 30;
      inclusionReason = '同文件或项目内相关';
      layer = 'reference';
    }

    candidates.push({ entity, relevanceScore, inclusionReason, layer });
  }

  return candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function applyTokenLimits(
  candidates: ScoredCandidate[],
  config: ContextPilotConfig
): ContextBundleItem[] {
  const layers = config.context.layers;
  const limits: Record<ContextLayer, number> = {
    core: layers.core.maxTokens,
    important: layers.important.maxTokens,
    reference: layers.reference.maxTokens,
  };
  const used: Record<ContextLayer, number> = { core: 0, important: 0, reference: 0 };
  const maxTotal = config.context.maxTotalTokens;
  let totalUsed = 0;
  const result: ContextBundleItem[] = [];

  for (const c of candidates) {
    const tokenCount = estimateTokens(c.entity.content);
    if (used[c.layer] + tokenCount > limits[c.layer]) continue;
    if (totalUsed + tokenCount > maxTotal) continue;
    used[c.layer] += tokenCount;
    totalUsed += tokenCount;
    result.push({
      entity: c.entity,
      relevanceScore: c.relevanceScore,
      inclusionReason: c.inclusionReason,
      layer: c.layer,
      tokenCount,
    });
  }

  return result;
}

/**
 * 组装上下文包
 */
export function assembleContext(input: AssemblerInput): ContextBundle {
  const scored = scoreAndLayer(
    input.focusEntity,
    input.entities,
    input.relationships,
    input.config
  );
  const contextEntities = applyTokenLimits(scored, input.config);
  const totalTokens = contextEntities.reduce((sum, i) => sum + i.tokenCount, 0);
  const entitiesByLayer = computeEntitiesByLayer(contextEntities);
  const primaryRelations = [...new Set(input.relationships.map((r) => r.type))];

  const bundle: ContextBundle = {
    id: createBundleId(input.focusEntity.id),
    focusEntity: input.focusEntity,
    contextEntities,
    summary: {
      totalTokens,
      entitiesByLayer,
      primaryRelations,
      estimatedAIQuality: Math.min(100, 60 + Math.floor(totalTokens / 100)),
    },
    timestamp: new Date().toISOString(),
  };
  return bundle;
}
