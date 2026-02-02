# Context Pilot

AI 上下文感知强化插件 —— 为 AI 编程助手提供精准、结构化的代码上下文。

## 功能概览

- **智能上下文分析**：函数/方法级依赖与关系分析
- **上下文分层**：核心层 / 重要层 / 参考层，可配置 token 分配
- **内存缓存**：LRU 缓存，减少重复分析
- **VS Code 集成**：状态栏、命令、上下文预览面板、任务摘要

## 快速开始

```bash
npm install
npm run compile
```

在 VS Code 中按 F5 启动扩展开发主机，即可调试插件。

## 命令

| 命令 | 说明 |
|------|------|
| Context Pilot: 分析当前上下文 | 根据当前光标位置分析并收集相关上下文 |
| Context Pilot: 显示上下文预览 | 打开 Webview 预览即将提供给 AI 的上下文 |
| Context Pilot: 生成任务摘要 | 生成结构化任务描述（可复制到外部 AI） |

## 配置

- 工作区或用户设置中可配置 `contextPilot.*` 各项
- 项目根目录可放置 `.contextpilotrc` 或 `.contextpilotrc.json`，参考 `.contextpilotrc.example`

## 测试

```bash
# 单元测试（不启动 VS Code）
npm run test:unit

# 扩展测试（需 VS Code 环境）
npm run test
```

## 项目结构

```
src/
  types/          # ContextEntity、RelationshipEdge、ContextBundle
  config/         # 配置类型与加载（.contextpilotrc + VS Code 设置）
  events/         # 内部事件总线
  cache/          # 内存缓存（LRU）
  analysis/       # 分析器与组装器
  core/           # ContextService 协调层
  ui/              # 预览面板
  extension.ts     # 扩展入口
test/
  unit/            # 单元测试
  suite/           # 扩展测试套件
  runTest.ts       # 扩展测试入口
docs/              # 产品与架构文档
```

## 文档

- [docs/1.md](docs/1.md) — 项目概述、功能需求、架构与实施计划
- [docs/2.md](docs/2.md) — 数据结构、事件系统、错误处理、UI 与配置

## 许可证

与项目一致。
