import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";

export interface IFieldPromptConfigRepository {
  loadAll(softwareDataPath: string): Promise<unknown | null>;
  saveAll(softwareDataPath: string, configs: Record<string, FieldPromptConfig>): Promise<void>;
}
