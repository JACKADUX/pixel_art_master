import { isTauri } from "@tauri-apps/api/core";
import type { IColorEditProcessor } from "@/application/ports/IColorEditProcessor";
import { typeScriptColorEditProcessor } from "./TypeScriptColorEditProcessor";
import { tauriColorEditProcessor } from "../tauri/TauriColorEditProcessor";

export function createColorEditProcessor(): IColorEditProcessor {
  return isTauri() ? tauriColorEditProcessor : typeScriptColorEditProcessor;
}

export const colorEditProcessor = createColorEditProcessor();
