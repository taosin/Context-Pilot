/**
 * 上下文服务单元测试 - 协调分析、缓存与组装
 */
import * as assert from 'assert';
import * as path from 'path';
import { ContextService } from '../../src/core/context-service';

describe('ContextService', () => {
  const workspaceRoot = path.join(__dirname, '../../');

  it('requestContext 无焦点实体时返回 null', async () => {
    const service = new ContextService({ workspaceRoot });
    const result = await service.requestContext({
      filePath: path.join(workspaceRoot, 'README.md'),
      content: '# Hello',
      cursorLine: 0,
      cursorCharacter: 0,
      language: 'markdown',
    });
    assert.strictEqual(result, null);
  });

  it('requestContext 有焦点实体时返回 ContextBundle', async () => {
    const service = new ContextService({ workspaceRoot });
    const code = `
function calculateTotal() {
  validateItems();
}
function validateItems() {}
`;
    const result = await service.requestContext({
      filePath: path.join(workspaceRoot, 'src/example.ts'),
      content: code,
      cursorLine: 2,
      cursorCharacter: 0,
      language: 'typescript',
    });
    assert.ok(result);
    assert.strictEqual(result!.focusEntity.name, 'calculateTotal');
    assert.ok(Array.isArray(result!.contextEntities));
  });

  it('相同输入第二次请求命中缓存', async () => {
    const service = new ContextService({ workspaceRoot });
    const input = {
      filePath: path.join(workspaceRoot, 'src/cache/memory-cache.ts'),
      content: 'function get(key: string) { return this.map.get(key); }',
      cursorLine: 0,
      cursorCharacter: 0,
      language: 'typescript',
    };
    const first = await service.requestContext(input);
    const second = await service.requestContext(input);
    assert.ok(first && second);
    assert.strictEqual(first.id, second!.id);
  });

  it('getConfig 返回当前配置', () => {
    const service = new ContextService({ workspaceRoot });
    const config = service.getConfig();
    assert.strictEqual(config.context.maxTotalTokens, 4000);
  });

  it('clearCache 后缓存为空', async () => {
    const service = new ContextService({ workspaceRoot });
    const code = 'function f() {}';
    await service.requestContext({
      filePath: '/x.ts',
      content: code,
      cursorLine: 0,
      cursorCharacter: 0,
      language: 'typescript',
    });
    service.clearCache();
    const result = await service.requestContext({
      filePath: '/x.ts',
      content: code,
      cursorLine: 0,
      cursorCharacter: 0,
      language: 'typescript',
    });
    assert.ok(result);
  });
});
