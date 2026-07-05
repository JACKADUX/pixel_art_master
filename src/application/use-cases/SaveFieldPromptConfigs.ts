import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import type { IFieldPromptConfigRepository } from "../ports/IFieldPromptConfigRepository";

export async function saveFieldPromptConfigs(
  repository: IFieldPromptConfigRepository,
  softwareDataPath: string,
  configs: Record<string, FieldPromptConfig>,
): Promise<void> {
  await repository.saveAll(softwareDataPath, configs);
}
