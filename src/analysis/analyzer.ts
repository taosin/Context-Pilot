/**
 * 上下文分析器 - 根据焦点位置分析并收集上下文候选
 * @see docs/1.md 4.2.1
 */
import type { ContextEntity } from '../types/context-entity';
import type { RelationshipEdge } from '../types/relationship-edge';
import { createEntityId } from '../types/context-entity';
import { emit, ContextPilotEventType } from '../events';

export interface AnalysisInput {
  filePath: string;
  content: string;
  cursorLine: number;
  cursorCharacter: number;
  language: string;
}

export interface AnalysisResult {
  focusEntity: ContextEntity | null;
  entities: ContextEntity[];
  relationships: RelationshipEdge[];
}

/**
 * 从代码内容中提取函数/类等实体（简化实现：基于正则）
 */
function extractEntities(filePath: string, content: string, language: string): ContextEntity[] {
  const entities: ContextEntity[] = [];
  const lines = content.split(/\r?\n/);

  const patterns: Array<{ type: ContextEntity['type']; regex: RegExp }> = [
    { type: 'function', regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/ },
    { type: 'function', regex: /^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/ },
    { type: 'class', regex: /^\s*(?:export\s+)?class\s+(\w+)/ },
    { type: 'interface', regex: /^\s*(?:export\s+)?interface\s+(\w+)/ },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { type, regex } of patterns) {
      const match = line.match(regex);
      if (match) {
        const name = match[1];
        const start = { line: i, character: 0 };
        let endLine = i;
        let braceCount = 0;
        const openChar = type === 'interface' ? '{' : '{';
        const closeChar = '}';
        const startLine = line;
        if (startLine.includes(openChar)) braceCount = (startLine.match(/\{/g) || []).length - (startLine.match(/\}/g) || []).length;
        for (let j = i + 1; j < lines.length && braceCount >= 0; j++) {
          const l = lines[j];
          braceCount += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
          endLine = j;
          if (braceCount <= 0) break;
        }
        const end = { line: endLine, character: lines[endLine]?.length ?? 0 };
        const range = { start, end };
        const entityContent = lines.slice(i, endLine + 1).join('\n');
        const id = createEntityId(filePath, range);
        entities.push({
          id,
          type,
          filePath,
          name,
          content: entityContent,
          range,
          language,
          metadata: {},
        });
        emit(ContextPilotEventType.ENTITY_DISCOVERED, { entityId: id, filePath });
        break;
      }
    }
  }
  return entities;
}

/**
 * 根据光标位置确定焦点实体
 */
function findFocusEntity(entities: ContextEntity[], cursorLine: number): ContextEntity | null {
  for (const entity of entities) {
    const { start, end } = entity.range;
    if (cursorLine >= start.line && cursorLine <= end.line) return entity;
  }
  return null;
}

/**
 * 在实体之间建立简单的调用/引用关系（占位：基于名称匹配）
 */
function buildRelationships(entities: ContextEntity[], focusId: string): RelationshipEdge[] {
  const relationships: RelationshipEdge[] = [];
  const names = new Set(entities.map((e) => e.name));
  for (const entity of entities) {
    const refs = entity.content.match(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g) || [];
    for (const ref of refs) {
      if (ref === entity.name) continue;
      const target = entities.find((e) => e.name === ref);
      if (target && names.has(ref)) {
        relationships.push({
          sourceId: entity.id,
          targetId: target.id,
          type: 'references',
          strength: 0.8,
          evidence: [],
          bidirectional: false,
        });
        emit(ContextPilotEventType.RELATIONSHIP_FOUND, {
          sourceId: entity.id,
          targetId: target.id,
          type: 'references',
        });
      }
    }
  }
  return relationships;
}

/**
 * 执行上下文分析
 */
export function analyzeContext(input: AnalysisInput): AnalysisResult {
  emit(ContextPilotEventType.ANALYSIS_STARTED, { projectRoot: input.filePath });
  const entities = extractEntities(input.filePath, input.content, input.language);
  const focusEntity = findFocusEntity(entities, input.cursorLine);
  const relationships = buildRelationships(entities, focusEntity?.id ?? '');
  return { focusEntity, entities, relationships };
}
