/**
 * 上下文组装器单元测试 - docs/1.md 2.1.2, 7.1
 */
import * as assert from 'assert';
import { assembleContext, type AssemblerInput } from '../../src/analysis/assembler';
import type { ContextEntity } from '../../src/types/context-entity';
import type { RelationshipEdge } from '../../src/types/relationship-edge';
import { DEFAULT_CONFIG } from '../../src/config/types';

function makeEntity(id: string, name: string, content: string): ContextEntity {
  return {
    id,
    type: 'function',
    filePath: '/src/f.ts',
    name,
    content,
    range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } },
    language: 'typescript',
    metadata: {},
  };
}

describe('Assembler', () => {
  it('生成 ContextBundle 含 focusEntity、contextEntities、summary', () => {
    const focus = makeEntity('id:0:0', 'main', 'function main() { helper(); }');
    const helper = makeEntity('id:1:0', 'helper', 'function helper() {}');
    const other = makeEntity('id:2:0', 'other', 'function other() {}');
    const edges: RelationshipEdge[] = [
      { sourceId: focus.id, targetId: helper.id, type: 'calls', strength: 1, evidence: [], bidirectional: false },
    ];
    const input: AssemblerInput = {
      focusEntity: focus,
      entities: [focus, helper, other],
      relationships: edges,
      config: DEFAULT_CONFIG,
    };
    const bundle = assembleContext(input);
    assert.ok(bundle.id.startsWith('bundle:'));
    assert.strictEqual(bundle.focusEntity.id, focus.id);
    assert.ok(bundle.contextEntities.length >= 1);
    const helperItem = bundle.contextEntities.find((i) => i.entity.name === 'helper');
    assert.ok(helperItem);
    assert.strictEqual(helperItem!.layer, 'core');
    assert.ok(helperItem!.relevanceScore >= 90);
    assert.strictEqual(bundle.summary.primaryRelations.includes('calls'), true);
  });

  it('遵守 maxTotalTokens 限制', () => {
    const focus = makeEntity('f', 'focus', 'x');
    const big = makeEntity('b', 'big', 'y'.repeat(10000));
    const input: AssemblerInput = {
      focusEntity: focus,
      entities: [focus, big],
      relationships: [],
      config: { ...DEFAULT_CONFIG, context: { ...DEFAULT_CONFIG.context, maxTotalTokens: 100 } },
    };
    const bundle = assembleContext(input);
    assert.ok(bundle.summary.totalTokens <= 100 + 50);
  });
});
