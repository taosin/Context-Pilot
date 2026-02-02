/**
 * 配置加载单元测试 - docs/1.md 6.1
 */
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { loadProjectConfig, getResolvedConfig, mergeVscodeConfig, DEFAULT_CONFIG } from '../../src/config';

describe('Config', () => {
  const fixtures = path.join(__dirname, '../fixtures');

  it('无项目配置时 loadProjectConfig 返回空对象', () => {
    const result = loadProjectConfig('/nonexistent/path');
    assert.deepStrictEqual(result, {});
  });

  it('存在 .contextpilotrc 时能解析并返回覆盖', () => {
    const dir = path.join(fixtures, 'with-config');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, '.contextpilotrc'),
        JSON.stringify({ context: { maxTotalTokens: 8000 } })
      );
    }
    const result = loadProjectConfig(dir);
    assert.strictEqual((result as { context?: { maxTotalTokens?: number } }).context?.maxTotalTokens, 8000);
  });

  it('mergeVscodeConfig 用 VS Code 设置覆盖', () => {
    const merged = mergeVscodeConfig(DEFAULT_CONFIG, {
      'contextPilot.context.maxTotalTokens': 6000,
      'contextPilot.analysis.enableGitHistory': false,
    });
    assert.strictEqual(merged.context.maxTotalTokens, 6000);
    assert.strictEqual(merged.analysis.enableGitHistory, false);
  });

  it('getResolvedConfig 无工作区时返回默认 + vscode 合并', () => {
    const resolved = getResolvedConfig('/no-project', {
      'contextPilot.context.maxTotalTokens': 2000,
    });
    assert.strictEqual(resolved.context.maxTotalTokens, 2000);
    assert.ok(resolved.analysis.enableSemanticAnalysis);
  });
});
