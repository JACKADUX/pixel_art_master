import { ComfyError } from "@/domain/comfyui/ComfyError";
import {
  extractEditableParameters,
  type ComfyParameter,
} from "@/domain/comfyui/ComfyParameter";
import {
  parseComfyApiWorkflow,
  type ComfyApiWorkflow,
} from "@/domain/comfyui/ComfyWorkflow";

export interface ImportedComfyWorkflow {
  workflow: ComfyApiWorkflow;
  parameters: ComfyParameter[];
}

/** 将原始 JSON 文本解析为工作流及其可编辑参数列表 */
export function importComfyWorkflow(jsonText: string): ImportedComfyWorkflow {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ComfyError("parse", "JSON 解析失败，请确认文件内容为合法 JSON");
  }

  const workflow = parseComfyApiWorkflow(parsed);
  const parameters = extractEditableParameters(workflow);
  return { workflow, parameters };
}
