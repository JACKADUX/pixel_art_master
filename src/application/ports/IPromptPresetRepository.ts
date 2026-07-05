import type { PromptPresetLibrary } from "@/domain/comfyApp/PromptPresetLibrary";

export interface IPromptPresetRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, library: PromptPresetLibrary): Promise<void>;
}
