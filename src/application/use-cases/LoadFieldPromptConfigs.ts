import { parseFieldPromptConfig, type FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import type { IFieldPromptConfigRepository } from "../ports/IFieldPromptConfigRepository";

export async function loadFieldPromptConfigs(
  repository: IFieldPromptConfigRepository,
  softwareDataPath: string,
): Promise<Record<string, FieldPromptConfig>> {
  const raw = await repository.loadAll(softwareDataPath);
  const result: Record<string, FieldPromptConfig> = {};

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    for (const fieldId of Object.keys(record)) {
      result[fieldId] = parseFieldPromptConfig(record[fieldId], fieldId);
    }
  }

  return result;
}
