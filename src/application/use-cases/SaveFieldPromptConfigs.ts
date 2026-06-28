import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import type { IFieldPromptConfigRepository } from "../ports/IFieldPromptConfigRepository";

export function saveFieldPromptConfigs(
  repository: IFieldPromptConfigRepository,
  configs: Record<string, FieldPromptConfig>
): void {
  repository.saveAll(configs);
}
