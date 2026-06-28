import type { IComfyUiSettingsRepository } from "@/application/ports/IComfyUiSettingsRepository";
import {
  createComfyServerConfig,
  type ComfyServerConfig,
} from "@/domain/comfyui/ComfyServerConfig";

const STORAGE_KEY = "pixelart.comfyui.settings";
const OUTPUT_TYPES_KEY = "pixelart.comfyui.outputClassTypes";
const VERSION = 1;

interface SerializedComfyUiSettings {
  version: number;
  address: string;
}

interface SerializedOutputClassTypes {
  version: number;
  types: string[];
}

export class LocalComfyUiSettingsRepository implements IComfyUiSettingsRepository {
  load(): ComfyServerConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const address = (parsed as SerializedComfyUiSettings).address;
      if (typeof address !== "string") return null;

      return createComfyServerConfig(address);
    } catch {
      return null;
    }
  }

  save(config: ComfyServerConfig): void {
    try {
      const payload: SerializedComfyUiSettings = {
        version: VERSION,
        address: config.address,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 忽略隐私模式 / 配额错误
    }
  }

  loadOutputClassTypes(): string[] | null {
    try {
      const stored = localStorage.getItem(OUTPUT_TYPES_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const types = (parsed as SerializedOutputClassTypes).types;
      if (!Array.isArray(types)) return null;

      return types.filter((item): item is string => typeof item === "string");
    } catch {
      return null;
    }
  }

  saveOutputClassTypes(types: string[]): void {
    try {
      const payload: SerializedOutputClassTypes = { version: VERSION, types };
      localStorage.setItem(OUTPUT_TYPES_KEY, JSON.stringify(payload));
    } catch {
      // 忽略隐私模式 / 配额错误
    }
  }
}

export const comfyUiSettingsRepository = new LocalComfyUiSettingsRepository();
