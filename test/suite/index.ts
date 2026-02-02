/**
 * Context Pilot 扩展测试套件 - 在 VS Code 环境中运行
 */
import * as path from 'path';
import * as vscode from 'vscode';

async function runExtensionTests(): Promise<void> {
  await vscode.commands.executeCommand('contextPilot.analyzeContext');
  await vscode.commands.executeCommand('contextPilot.showPreview');
  await vscode.commands.executeCommand('contextPilot.generateSummary');
}

export async function run(): Promise<void> {
  const projectRoot = path.join(__dirname, '../../');
  const testWorkspace = vscode.Uri.file(projectRoot);
  await vscode.workspace.getWorkspaceFolder(testWorkspace);
  await runExtensionTests();
}
