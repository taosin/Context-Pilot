/**
 * Context Pilot - VS Code 扩展入口
 * @see docs/1.md
 */
import * as vscode from 'vscode';
import { ContextService } from './core/context-service';
import { createContextPreviewPanel } from './ui/preview-panel';

let contextService: ContextService | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    console.warn('[Context Pilot] No workspace folder opened.');
    return;
  }

  const vscodeConfig = getVscodeConfig();
  contextService = new ContextService({
    workspaceRoot,
    vscodeConfig,
    maxCacheItems: (vscodeConfig['contextPilot.cache.maxMemoryItems'] as number) ?? 50,
  });

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(symbol-method) Context Pilot';
  statusBarItem.tooltip = 'AI 上下文感知 - 点击分析当前上下文';
  statusBarItem.command = 'contextPilot.analyzeContext';
  statusBarItem.show();

  context.subscriptions.push(
    vscode.commands.registerCommand('contextPilot.analyzeContext', async () => {
      await runAnalyzeContext();
    }),
    vscode.commands.registerCommand('contextPilot.showPreview', async () => {
      await runShowPreview();
    }),
    vscode.commands.registerCommand('contextPilot.generateSummary', async () => {
      await runGenerateSummary();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('contextPilot') && contextService) {
        contextService.updateConfig(getVscodeConfig());
      }
    })
  );

  context.subscriptions.push({
    dispose: () => {
      statusBarItem?.dispose();
      statusBarItem = null;
      contextService = null;
    },
  });
}

function getVscodeConfig(): Record<string, unknown> {
  const config = vscode.workspace.getConfiguration();
  const keys = [
    'contextPilot.context.maxTotalTokens',
    'contextPilot.context.layers.core.maxTokens',
    'contextPilot.context.layers.important.maxTokens',
    'contextPilot.context.layers.reference.maxTokens',
    'contextPilot.analysis.enableGitHistory',
    'contextPilot.analysis.historyLookbackDays',
    'contextPilot.analysis.enableSemanticAnalysis',
    'contextPilot.analysis.similarityThreshold',
    'contextPilot.cache.maxMemoryItems',
  ];
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const val = config.get(key);
    if (val !== undefined) out[key] = val;
  }
  return out;
}

async function runAnalyzeContext(): Promise<void> {
  if (!contextService) return;
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('请先打开一个代码文件。');
    return;
  }
  const doc = editor.document;
  const pos = editor.selection.active;
  const input = {
    filePath: doc.uri.fsPath,
    content: doc.getText(),
    cursorLine: pos.line,
    cursorCharacter: pos.character,
    language: doc.languageId,
  };
  try {
    const bundle = await contextService.requestContext(input);
    if (bundle) {
      if (statusBarItem) {
        statusBarItem.text = `$(check) ${bundle.contextEntities.length} 个上下文`;
      }
      vscode.window.showInformationMessage(
        `Context Pilot: 已收集 ${bundle.contextEntities.length} 个相关实体，约 ${bundle.summary.totalTokens} tokens。`
      );
    } else {
      vscode.window.showInformationMessage('Context Pilot: 未能在当前位置识别到可分析的代码实体。');
    }
  } catch (err) {
    vscode.window.showErrorMessage('Context Pilot 分析失败: ' + (err as Error).message);
  }
}

async function runShowPreview(): Promise<void> {
  if (!contextService) return;
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('请先打开一个代码文件。');
    return;
  }
  const doc = editor.document;
  const pos = editor.selection.active;
  const input = {
    filePath: doc.uri.fsPath,
    content: doc.getText(),
    cursorLine: pos.line,
    cursorCharacter: pos.character,
    language: doc.languageId,
  };
  const bundle = await contextService.requestContext(input);
  if (bundle) {
    createContextPreviewPanel(contextService.getConfig(), bundle);
  } else {
    vscode.window.showInformationMessage('Context Pilot: 未能在当前位置识别到可分析的代码实体。');
  }
}

async function runGenerateSummary(): Promise<void> {
  if (!contextService) return;
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('请先打开一个代码文件。');
    return;
  }
  const doc = editor.document;
  const pos = editor.selection.active;
  const input = {
    filePath: doc.uri.fsPath,
    content: doc.getText(),
    cursorLine: pos.line,
    cursorCharacter: pos.character,
    language: doc.languageId,
  };
  const bundle = await contextService.requestContext(input);
  if (bundle) {
    const lines: string[] = [
      '# 任务摘要',
      '',
      `**焦点**: ${bundle.focusEntity.name} (${bundle.focusEntity.type})`,
      `**文件**: ${bundle.focusEntity.filePath}`,
      `**相关实体**: ${bundle.contextEntities.length} 个`,
      `**预估 tokens**: ${bundle.summary.totalTokens}`,
      '',
      '## 焦点代码',
      '```' + bundle.focusEntity.language,
      bundle.focusEntity.content,
      '```',
    ];
    const text = lines.join('\n');
    const summaryDoc = await vscode.workspace.openTextDocument({
      content: text,
      language: 'markdown',
    });
    await vscode.window.showTextDocument(summaryDoc);
  } else {
    vscode.window.showInformationMessage('Context Pilot: 未能在当前位置识别到可分析的代码实体。');
  }
}

export function deactivate(): void {
  statusBarItem?.dispose();
  contextService = null;
}
