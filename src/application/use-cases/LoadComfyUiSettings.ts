import { createComfyServerConfig, type ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import type { IComfyUiSettingsRepository } from "../ports/IComfyUiSettingsRepository";

export function loadComfyUiSettings(
  repository: IComfyUiSettingsRepository,
): ComfyServerConfig {
  const stored = repository.load();
  if (!stored) {
    return createComfyServerConfig();
  }
  return createComfyServerConfig(stored.address);
}
