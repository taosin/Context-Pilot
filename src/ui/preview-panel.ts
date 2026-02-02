/**
 * 上下文预览面板 - docs/1.md 2.1.3, docs/2.md 14.1.1
 */
import * as vscode from 'vscode';
import type { ContextBundle, ContextBundleItem } from '../types/context-bundle';
import type { ContextPilotConfig } from '../config/types';

let previewPanel: vscode.WebviewPanel | undefined;

export function createContextPreviewPanel(config: ContextPilotConfig, bundle: ContextBundle): void {
  const title = `上下文预览 - ${bundle.focusEntity.name}()`;
  if (previewPanel) {
    previewPanel.reveal();
    previewPanel.webview.html = buildHtml(config, bundle);
    return;
  }
  previewPanel = vscode.window.createWebviewPanel(
    'contextPilotPreview',
    title,
    vscode.ViewColumn.Beside,
    { enableScripts: false }
  );
  previewPanel.webview.html = buildHtml(config, bundle);
  previewPanel.onDidDispose(() => {
    previewPanel = undefined;
  });
}

function buildHtml(config: ContextPilotConfig, bundle: ContextBundle): string {
  const byLayer = bundle.summary.entitiesByLayer;
  const coreItems = bundle.contextEntities.filter((i) => i.layer === 'core');
  const importantItems = bundle.contextEntities.filter((i) => i.layer === 'important');
  const referenceItems = bundle.contextEntities.filter((i) => i.layer === 'reference');

  const renderList = (items: ContextBundleItem[], layerName: string) => {
    if (items.length === 0) return `<p><em>无</em></p>`;
    return `
      <ul>
        ${items
          .map(
            (i) =>
              `<li><strong>${escapeHtml(i.entity.name)}</strong> (${i.relevanceScore}分) - ${escapeHtml(i.inclusionReason)} <code>${i.tokenCount} tokens</code></li>`
          )
          .join('')}
      </ul>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: var(--vscode-font-family); padding: 1em; font-size: 13px; }
    h2 { margin-top: 1em; color: var(--vscode-foreground); }
    code { background: var(--vscode-textBlockQuote-background); padding: 2px 6px; border-radius: 4px; }
    .summary { background: var(--vscode-editor-inactiveSelectionBackground); padding: 8px; border-radius: 4px; margin: 8px 0; }
  </style>
</head>
<body>
  <h1>上下文预览 - ${escapeHtml(bundle.focusEntity.name)}</h1>
  <p><strong>焦点实体:</strong> ${escapeHtml(bundle.focusEntity.type)} @ ${escapeHtml(bundle.focusEntity.filePath)}</p>
  <pre style="background: var(--vscode-textBlockQuote-background); padding: 8px; overflow: auto; max-height: 200px;">${escapeHtml(bundle.focusEntity.content)}</pre>

  <h2>核心上下文 (${byLayer.core ?? 0} 个)</h2>
  ${renderList(coreItems, 'core')}

  <h2>重要上下文 (${byLayer.important ?? 0} 个)</h2>
  ${renderList(importantItems, 'important')}

  <h2>参考上下文 (${byLayer.reference ?? 0} 个)</h2>
  ${renderList(referenceItems, 'reference')}

  <div class="summary">
    <strong>总览:</strong> ${bundle.contextEntities.length} 个实体 · ${bundle.summary.totalTokens} / ${config.context.maxTotalTokens} tokens · 预估质量 ${bundle.summary.estimatedAIQuality}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
