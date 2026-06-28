import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";

export interface IFieldPromptConfigRepository {
  loadAll(): unknown | null;
  saveAll(configs: Record<string, FieldPromptConfig>): void;
}
