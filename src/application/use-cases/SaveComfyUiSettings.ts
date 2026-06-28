import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import type { IComfyUiSettingsRepository } from "../ports/IComfyUiSettingsRepository";

export function saveComfyUiSettings(
  repository: IComfyUiSettingsRepository,
  config: ComfyServerConfig,
): void {
  repository.save(config);
}
