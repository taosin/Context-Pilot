/**
 * 核心数据模型与工具函数单元测试
 * @see docs/2.md 10.1
 */
import * as assert from 'assert';
import {
  createEntityId,
  parseEntityId,
  createBundleId,
  computeEntitiesByLayer,
  type ContextEntity,
  type ContextBundleItem,
  type ContextLayer,
} from '../../src/types';

describe('context-entity', () => {
  it('createEntityId 格式为 文件路径:起始行:起始列', () => {
    const id = createEntityId('/src/foo.ts', { start: { line: 10, character: 0 }, end: { line: 20, character: 5 } });
    assert.strictEqual(id, '/src/foo.ts:10:0');
  });

  it('parseEntityId 能解析出 filePath, line, character', () => {
    const id = '/abs/path/file.ts:5:3';
    const parsed = parseEntityId(id);
    assert.ok(parsed);
    assert.strictEqual(parsed!.filePath, '/abs/path/file.ts');
    assert.strictEqual(parsed!.line, 5);
    assert.strictEqual(parsed!.character, 3);
  });

  it('parseEntityId 对非法 ID 返回 null', () => {
    assert.strictEqual(parseEntityId(''), null);
    assert.strictEqual(parseEntityId('nocolon'), null);
    assert.strictEqual(parseEntityId('a:b'), null);
  });
});

describe('context-bundle', () => {
  it('createBundleId 包含焦点实体 ID 与时间戳', () => {
    const id = createBundleId('entity1');
    assert.ok(id.startsWith('bundle:entity1:'));
    const ts = parseInt(id.split(':')[2], 10);
    assert.ok(Number.isInteger(ts) && ts > 0);
  });

  it('computeEntitiesByLayer 按层统计数量', () => {
    const items: ContextBundleItem[] = [
      { entity: {} as ContextEntity, relevanceScore: 90, inclusionReason: '', layer: 'core' as ContextLayer, tokenCount: 100 },
      { entity: {} as ContextEntity, relevanceScore: 70, inclusionReason: '', layer: 'core' as ContextLayer, tokenCount: 50 },
      { entity: {} as ContextEntity, relevanceScore: 50, inclusionReason: '', layer: 'important' as ContextLayer, tokenCount: 30 },
    ];
    const byLayer = computeEntitiesByLayer(items);
    assert.strictEqual(byLayer.core, 2);
    assert.strictEqual(byLayer.important, 1);
    assert.strictEqual(byLayer.reference, 0);
  });
});
