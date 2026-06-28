import { ComfyError } from "./ComfyError";

/** API 格式工作流中单个节点的输入值：基础标量或 [nodeId, slot] 连线引用 */
export type ComfyInputValue =
  | string
  | number
  | boolean
  | [string, number]
  | unknown;

export interface ComfyNode {
  class_type: string;
  inputs: Record<string, ComfyInputValue>;
  _meta?: { title?: string };
}

/** API 格式工作流：节点 id -> 节点定义 */
export type ComfyApiWorkflow = Record<string, ComfyNode>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isComfyNode(value: unknown): value is ComfyNode {
  if (!isRecord(value)) return false;
  return typeof value.class_type === "string" && isRecord(value.inputs);
}

/** 判断对象是否为 API 格式节点表（所有值都是节点） */
export function looksLikeNodeMap(value: unknown): value is ComfyApiWorkflow {
  if (!isRecord(value)) return false;
  const entries = Object.values(value);
  if (entries.length === 0) return false;
  return entries.every(isComfyNode);
}

/**
 * 解析并校验 API 格式工作流 JSON。
 * 兼容直接节点表，以及被 `{ prompt: {...} }` 包裹的形式。
 */
export function parseComfyApiWorkflow(json: unknown): ComfyApiWorkflow {
  if (json === null || json === undefined) {
    throw new ComfyError("parse", "工作流内容为空");
  }

  if (looksLikeNodeMap(json)) {
    return json;
  }

  if (isRecord(json) && looksLikeNodeMap(json.prompt)) {
    return json.prompt;
  }

  throw new ComfyError(
    "parse",
    "无法识别的工作流格式，请导入 ComfyUI 开发者模式下「Save (API Format)」导出的 JSON",
  );
}

/** 节点显示标题：优先 _meta.title，否则用 class_type */
export function getNodeTitle(node: ComfyNode): string {
  return node._meta?.title?.trim() || node.class_type;
}

/** 深拷贝工作流，避免回填参数时修改原对象 */
export function cloneWorkflow(workflow: ComfyApiWorkflow): ComfyApiWorkflow {
  return structuredClone(workflow);
}
