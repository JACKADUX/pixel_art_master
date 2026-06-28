import type { PromptPresetLibrary } from "@/domain/comfyApp/PromptPresetLibrary";

export interface IPromptPresetRepository {
  load(): unknown | null;
  save(library: PromptPresetLibrary): void;
}
