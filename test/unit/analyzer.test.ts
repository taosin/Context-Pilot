/**
 * 上下文分析器单元测试 - docs/1.md 4.2.1, 7.1
 */
import * as assert from 'assert';
import { analyzeContext, type AnalysisInput } from '../../src/analysis/analyzer';

describe('Analyzer', () => {
  it('从 TypeScript 代码中提取 function 和 class 实体', () => {
    const content = `
function foo() {
  bar();
}
class MyClass {
  method() {}
}
`;
    const input: AnalysisInput = {
      filePath: '/src/test.ts',
      content,
      cursorLine: 2,
      cursorCharacter: 0,
      language: 'typescript',
    };
    const result = analyzeContext(input);
    assert.ok(result.entities.length >= 1);
    const fn = result.entities.find((e) => e.name === 'foo');
    assert.ok(fn);
    assert.strictEqual(fn!.type, 'function');
    assert.ok(result.focusEntity && result.focusEntity.name === 'foo');
  });

  it('光标在 class 内时焦点实体为 class', () => {
    const content = `
class A {
  run() {
    return 1;
  }
}
`;
    const input: AnalysisInput = {
      filePath: '/src/a.ts',
      content,
      cursorLine: 3,
      cursorCharacter: 0,
      language: 'typescript',
    };
    const result = analyzeContext(input);
    assert.ok(result.focusEntity);
    assert.strictEqual(result.focusEntity!.name, 'A');
  });

  it('无匹配实体时 focusEntity 为 null', () => {
    const input: AnalysisInput = {
      filePath: '/src/empty.ts',
      content: 'const x = 1;',
      cursorLine: 0,
      cursorCharacter: 0,
      language: 'typescript',
    };
    const result = analyzeContext(input);
    assert.strictEqual(result.focusEntity, null);
    assert.strictEqual(result.entities.length, 0);
  });
});
