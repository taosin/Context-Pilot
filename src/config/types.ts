/**
 * 配置类型定义 - 对应 docs/1.md 6.1 .contextpilotrc
 */
export interface ContextLayerConfig {
  maxTokens: number;
  required: boolean;
}

export interface ContextConfig {
  maxTotalTokens: number;
  layers: {
    core: ContextLayerConfig;
    important: ContextLayerConfig;
    reference: ContextLayerConfig;
  };
}

export interface AnalysisConfig {
  enableGitHistory: boolean;
  historyLookbackDays: number;
  enableSemanticAnalysis: boolean;
  similarityThreshold: number;
}

export interface CopilotIntegrationConfig {
  enabled: boolean;
  autoInject: boolean;
}

export interface RagIntegrationConfig {
  enabled: boolean;
  indexOnSave: boolean;
}

export interface IntegrationsConfig {
  copilot: CopilotIntegrationConfig;
  rag: RagIntegrationConfig;
}

export interface CacheConfig {
  maxMemoryItems: number;
}

export interface ContextPilotConfig {
  version: string;
  context: ContextConfig;
  analysis: AnalysisConfig;
  integrations: IntegrationsConfig;
  cache?: CacheConfig;
}

export const DEFAULT_CONFIG: ContextPilotConfig = {
  version: '1.0',
  context: {
    maxTotalTokens: 4000,
    layers: {
      core: { maxTokens: 2000, required: true },
      important: { maxTokens: 1500, required: false },
      reference: { maxTokens: 500, required: false },
    },
  },
  analysis: {
    enableGitHistory: true,
    historyLookbackDays: 30,
    enableSemanticAnalysis: true,
    similarityThreshold: 0.7,
  },
  integrations: {
    copilot: { enabled: true, autoInject: true },
    rag: { enabled: false, indexOnSave: false },
  },
  cache: { maxMemoryItems: 50 },
};
