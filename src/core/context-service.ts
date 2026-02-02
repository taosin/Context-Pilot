/**
 * 上下文服务 - 协调分析、缓存与组装，对外提供统一接口
 */
import type { ContextBundle } from '../types/context-bundle';
import type { ContextPilotConfig } from '../config/types';
import { getResolvedConfig } from '../config/loader';
import { MemoryCache } from '../cache/memory-cache';
import { analyzeContext, type AnalysisInput } from '../analysis/analyzer';
import { assembleContext } from '../analysis/assembler';
import { emit, ContextPilotEventType } from '../events';

export interface ContextServiceOptions {
  workspaceRoot: string;
  vscodeConfig?: Record<string, unknown>;
  maxCacheItems?: number;
}

export class ContextService {
  private workspaceRoot: string;
  private config: ContextPilotConfig;
  private cache: MemoryCache;

  constructor(options: ContextServiceOptions) {
    this.workspaceRoot = options.workspaceRoot;
    this.config = getResolvedConfig(options.workspaceRoot, options.vscodeConfig ?? {});
    this.cache = new MemoryCache({
      maxItems: options.maxCacheItems ?? this.config.cache?.maxMemoryItems ?? 50,
    });
  }

  /**
   * 根据当前焦点请求上下文包；优先使用缓存
   */
  async requestContext(input: AnalysisInput): Promise<ContextBundle | null> {
    const cacheKey = `bundle:${input.filePath}:${input.cursorLine}:${input.cursorCharacter}`;
    const cached = this.cache.get<ContextBundle>(cacheKey);
    if (cached) return cached;

    const result = analyzeContext(input);
    if (!result.focusEntity) return null;

    const bundle = assembleContext({
      focusEntity: result.focusEntity,
      entities: result.entities,
      relationships: result.relationships,
      config: this.config,
    });

    this.cache.set(cacheKey, bundle);
    emit(ContextPilotEventType.CONTEXT_GENERATED, {
      bundleId: bundle.id,
      entityCount: bundle.contextEntities.length,
      totalTokens: bundle.summary.totalTokens,
    });
    return bundle;
  }

  /**
   * 更新配置（例如 VS Code 设置变更后）
   */
  updateConfig(vscodeConfig: Record<string, unknown>): void {
    this.config = getResolvedConfig(this.workspaceRoot, vscodeConfig);
  }

  getConfig(): ContextPilotConfig {
    return this.config;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
