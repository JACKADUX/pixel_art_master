import {
  cloneWorkflow,
  getNodeTitle,
  type ComfyApiWorkflow,
} from "./ComfyWorkflow";

export type ComfyParameterType = "string" | "number" | "boolean";

export interface ComfyParameter {
  /** 唯一标识：`${nodeId}:${inputKey}` */
  id: string;
  nodeId: string;
  classType: string;
  nodeTitle: string;
  inputKey: string;
  type: ComfyParameterType;
  value: string | number | boolean;
}

export function buildParameterId(nodeId: string, inputKey: string): string {
  return `${nodeId}:${inputKey}`;
}

function resolveScalarType(value: unknown): ComfyParameterType | null {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return null;
}

/**
 * 遍历所有节点输入，抽取可编辑的基础标量参数。
 * 连线输入（形如 [nodeId, slot] 的数组）与对象不会被纳入。
 */
export function extractEditableParameters(workflow: ComfyApiWorkflow): ComfyParameter[] {
  const parameters: ComfyParameter[] = [];

  for (const [nodeId, node] of Object.entries(workflow)) {
    const nodeTitle = getNodeTitle(node);
    for (const [inputKey, rawValue] of Object.entries(node.inputs)) {
      const type = resolveScalarType(rawValue);
      if (!type) continue;
      parameters.push({
        id: buildParameterId(nodeId, inputKey),
        nodeId,
        classType: node.class_type,
        nodeTitle,
        inputKey,
        type,
        value: rawValue as string | number | boolean,
      });
    }
  }

  return parameters;
}

/** 将编辑后的参数回填到工作流副本，得到可提交的 prompt 节点表 */
export function applyParameterOverrides(
  workflow: ComfyApiWorkflow,
  parameters: ComfyParameter[],
): ComfyApiWorkflow {
  const next = cloneWorkflow(workflow);

  for (const parameter of parameters) {
    const node = next[parameter.nodeId];
    if (!node) continue;
    if (!(parameter.inputKey in node.inputs)) continue;
    node.inputs[parameter.inputKey] = parameter.value;
  }

  return next;
}

/** 更新参数列表中某项的值，返回新数组（不可变） */
export function setParameterValue(
  parameters: ComfyParameter[],
  id: string,
  value: string | number | boolean,
): ComfyParameter[] {
  return parameters.map((parameter) =>
    parameter.id === id ? { ...parameter, value } : parameter,
  );
}
