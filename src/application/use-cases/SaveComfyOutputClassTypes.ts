import type { IComfyUiSettingsRepository } from "@/application/ports/IComfyUiSettingsRepository";
import { normalizeOutputClassTypes } from "@/domain/comfyui/ComfyOutputNode";

/** 持久化“可导出图片”节点类型白名单（规范化后存储） */
export async function saveComfyOutputClassTypes(
  repository: IComfyUiSettingsRepository,
  softwareDataPath: string,
  types: readonly string[],
): Promise<string[]> {
  const normalized = normalizeOutputClassTypes(types);
  await repository.saveOutputClassTypes(softwareDataPath, normalized);
  return normalized;
}
