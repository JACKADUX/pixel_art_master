import { parseFieldPromptConfig, type FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import type { IFieldPromptConfigRepository } from "../ports/IFieldPromptConfigRepository";

export function loadFieldPromptConfigs(repository: IFieldPromptConfigRepository): Record<string, FieldPromptConfig> {
  const raw = repository.loadAll();
  const result: Record<string, FieldPromptConfig> = {};
  
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    for (const fieldId of Object.keys(record)) {
      result[fieldId] = parseFieldPromptConfig(record[fieldId], fieldId);
    }
  }
  
  return result;
}
