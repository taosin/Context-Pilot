/**
 * 上下文实体 - 代码中的一个逻辑单元（函数、类、接口等）
 * @see docs/2.md 10.1.1
 */
export type ContextEntityType =
  | 'function'
  | 'class'
  | 'interface'
  | 'variable'
  | 'import'
  | 'comment';

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface ContextEntityMetadata {
  complexity?: number;
  lastModified?: string;
  author?: string;
  gitCommit?: string;
}

export interface ContextEntity {
  id: string;
  type: ContextEntityType;
  filePath: string;
  name: string;
  content: string;
  range: Range;
  language: string;
  metadata: ContextEntityMetadata;
}

/**
 * 生成实体的唯一 ID
 * 格式: "文件路径:起始行:起始列"
 */
export function createEntityId(filePath: string, range: Range): string {
  return `${filePath}:${range.start.line}:${range.start.character}`;
}

/**
 * 从 ID 解析出文件路径（ID 中可能包含 : 在路径里，取到最后一个 :行:列）
 */
export function parseEntityId(id: string): { filePath: string; line: number; character: number } | null {
  const lastColon = id.lastIndexOf(':');
  if (lastColon <= 0) return null;
  const beforeLast = id.lastIndexOf(':', lastColon - 1);
  if (beforeLast < 0) return null;
  const filePath = id.substring(0, beforeLast);
  const line = parseInt(id.substring(beforeLast + 1, lastColon), 10);
  const character = parseInt(id.substring(lastColon + 1), 10);
  if (isNaN(line) || isNaN(character)) return null;
  return { filePath, line, character };
}
