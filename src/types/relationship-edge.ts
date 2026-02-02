/**
 * 关系边 - 两个上下文实体之间的连接
 * @see docs/2.md 10.1.2
 */
export type RelationshipType = 'calls' | 'inherits' | 'implements' | 'references' | 'similar';

export interface RelationshipEdge {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number;
  evidence: string[];
  bidirectional: boolean;
}

/**
 * 创建关系边的工厂
 */
export function createRelationshipEdge(
  sourceId: string,
  targetId: string,
  type: RelationshipType,
  options: Partial<Pick<RelationshipEdge, 'strength' | 'evidence' | 'bidirectional'>> = {}
): RelationshipEdge {
  return {
    sourceId,
    targetId,
    type,
    strength: options.strength ?? 1,
    evidence: options.evidence ?? [],
    bidirectional: options.bidirectional ?? false,
  };
}
