import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";

export interface IComfyUiSettingsRepository {
  load(): ComfyServerConfig | null;
  save(config: ComfyServerConfig): void;
  /** 读取“可导出图片”节点类型白名单；未配置时返回 null */
  loadOutputClassTypes(): string[] | null;
  saveOutputClassTypes(types: string[]): void;
}
