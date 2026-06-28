import { getNodeTitle, type ComfyApiWorkflow } from "./ComfyWorkflow";

/**
 * 默认的“可导出图片”节点 class_type 白名单。
 * 用户可在模块页顶部的设置弹窗中增删，配置会被持久化。
 */
export const DEFAULT_OUTPUT_CLASS_TYPES: readonly string[] = [
  "SaveImage",
  "PreviewImage",
  "SaveImageWebsocket",
  "SaveAnimatedWEBP",
  "SaveAnimatedPNG",
  "VHS_VideoCombine",
  "Image Save",
];

/** 工作流中的单个节点（含其 id），供面板渲染 */
export interface ComfyWorkflowNode {
  nodeId: string;
  classType: string;
  nodeTitle: string;
}

/** 去重、去空白、保持顺序地规范化 class_type 白名单 */
export function normalizeOutputClassTypes(types: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of types) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

/** 列出工作流中的全部节点（按数字 id 升序，便于稳定显示） */
export function listWorkflowNodes(workflow: ComfyApiWorkflow): ComfyWorkflowNode[] {
  const nodes: ComfyWorkflowNode[] = Object.entries(workflow).map(([nodeId, node]) => ({
    nodeId,
    classType: node.class_type,
    nodeTitle: getNodeTitle(node),
  }));
  nodes.sort((a, b) => {
    const na = Number(a.nodeId);
    const nb = Number(b.nodeId);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.nodeId.localeCompare(b.nodeId);
  });
  return nodes;
}

/** 收集工作流中出现过的全部 class_type（去重、排序），用于类型过滤下拉 */
export function collectWorkflowClassTypes(workflow: ComfyApiWorkflow): string[] {
  const set = new Set<string>();
  for (const node of Object.values(workflow)) {
    set.add(node.class_type);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** 判断节点 class_type 是否属于“可导出图片”类型 */
export function isExportableClassType(
  classType: string,
  outputClassTypes: readonly string[],
): boolean {
  return outputClassTypes.includes(classType);
}

/** 取出工作流中所有“可导出图片”节点的 id（class_type 命中白名单） */
export function getExportableNodeIds(
  workflow: ComfyApiWorkflow,
  outputClassTypes: readonly string[],
): string[] {
  const allow = new Set(outputClassTypes);
  const ids: string[] = [];
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (allow.has(node.class_type)) ids.push(nodeId);
  }
  return ids;
}
