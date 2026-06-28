import type { IComfyUiSettingsRepository } from "@/application/ports/IComfyUiSettingsRepository";
import { normalizeOutputClassTypes } from "@/domain/comfyui/ComfyOutputNode";

/** 持久化“可导出图片”节点类型白名单（规范化后存储） */
export function saveComfyOutputClassTypes(
  repository: IComfyUiSettingsRepository,
  types: readonly string[],
): string[] {
  const normalized = normalizeOutputClassTypes(types);
  repository.saveOutputClassTypes(normalized);
  return normalized;
}
