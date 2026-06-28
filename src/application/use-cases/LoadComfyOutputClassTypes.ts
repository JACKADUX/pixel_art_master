import type { IComfyUiSettingsRepository } from "@/application/ports/IComfyUiSettingsRepository";
import {
  DEFAULT_OUTPUT_CLASS_TYPES,
  normalizeOutputClassTypes,
} from "@/domain/comfyui/ComfyOutputNode";

/** 读取“可导出图片”节点类型白名单，未配置时回退默认值 */
export function loadComfyOutputClassTypes(
  repository: IComfyUiSettingsRepository,
): string[] {
  const stored = repository.loadOutputClassTypes();
  if (!stored) {
    return [...DEFAULT_OUTPUT_CLASS_TYPES];
  }
  const normalized = normalizeOutputClassTypes(stored);
  return normalized.length > 0 ? normalized : [...DEFAULT_OUTPUT_CLASS_TYPES];
}
