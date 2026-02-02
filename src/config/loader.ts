/**
 * 配置加载器 - 从 .contextpilotrc 或 VS Code 设置加载配置
 */
import type { ContextPilotConfig } from './types';
import { DEFAULT_CONFIG } from './types';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_FILE_NAMES = ['.contextpilotrc', '.contextpilotrc.json'];

/**
 * 深度合并对象，用于覆盖默认配置
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key];
    if (srcVal !== undefined) {
      const tgtVal = result[key];
      if (
        typeof srcVal === 'object' &&
        srcVal !== null &&
        !Array.isArray(srcVal) &&
        typeof tgtVal === 'object' &&
        tgtVal !== null &&
        !Array.isArray(tgtVal)
      ) {
        (result as Record<string, unknown>)[key as string] = deepMerge(
          tgtVal as object,
          srcVal as object
        ) as unknown;
      } else {
        (result as Record<string, unknown>)[key as string] = srcVal as unknown;
      }
    }
  }
  return result;
}

/**
 * 从项目根目录加载 .contextpilotrc
 */
export function loadProjectConfig(workspaceRoot: string): Partial<ContextPilotConfig> {
  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.join(workspaceRoot, name);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content) as Partial<ContextPilotConfig>;
        return parsed;
      }
    } catch {
      // 忽略解析错误，返回空覆盖
    }
  }
  return {};
}

/**
 * 从 VS Code 配置对象合并（由 extension 传入）
 */
export function mergeVscodeConfig(
  base: ContextPilotConfig,
  vscodeConfig: Record<string, unknown>
): ContextPilotConfig {
  const mapping: Array<{ key: string; path: string[] }> = [
    { key: 'contextPilot.context.maxTotalTokens', path: ['context', 'maxTotalTokens'] },
    { key: 'contextPilot.context.layers.core.maxTokens', path: ['context', 'layers', 'core', 'maxTokens'] },
    { key: 'contextPilot.context.layers.important.maxTokens', path: ['context', 'layers', 'important', 'maxTokens'] },
    { key: 'contextPilot.context.layers.reference.maxTokens', path: ['context', 'layers', 'reference', 'maxTokens'] },
    { key: 'contextPilot.analysis.enableGitHistory', path: ['analysis', 'enableGitHistory'] },
    { key: 'contextPilot.analysis.historyLookbackDays', path: ['analysis', 'historyLookbackDays'] },
    { key: 'contextPilot.analysis.enableSemanticAnalysis', path: ['analysis', 'enableSemanticAnalysis'] },
    { key: 'contextPilot.analysis.similarityThreshold', path: ['analysis', 'similarityThreshold'] },
    { key: 'contextPilot.cache.maxMemoryItems', path: ['cache', 'maxMemoryItems'] as unknown as string[] },
  ];
  let overlay: Partial<ContextPilotConfig> = {};
  for (const { key, path: p } of mapping) {
    const val = vscodeConfig[key];
    if (val !== undefined) {
      let current: Record<string, unknown> = overlay as Record<string, unknown>;
      for (let i = 0; i < p.length - 1; i++) {
        const k = p[i];
        if (!(k in current) || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k] as Record<string, unknown>;
      }
      current[p[p.length - 1]] = val;
    }
  }
  return deepMerge(base as object, overlay as object) as ContextPilotConfig;
}

/**
 * 获取最终配置：默认 + 项目 .contextpilotrc + VS Code 设置
 */
export function getResolvedConfig(
  workspaceRoot: string,
  vscodeConfig: Record<string, unknown> = {}
): ContextPilotConfig {
  const projectOverlay = loadProjectConfig(workspaceRoot);
  const base = deepMerge(DEFAULT_CONFIG, projectOverlay);
  return mergeVscodeConfig(base, vscodeConfig);
}
