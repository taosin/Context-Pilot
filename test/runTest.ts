/**
 * VS Code 扩展测试入口 - 启动 Electron 并运行 test/suite
 */
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Extension tests failed:', err);
    process.exit(1);
  }
}

main();
