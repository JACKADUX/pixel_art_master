import type { EditorPreferences } from "@/domain/preferences/EditorPreferences";
import type { IEditorPreferencesRepository } from "../ports/IEditorPreferencesRepository";

export async function saveEditorPreferences(
  repository: IEditorPreferencesRepository,
  softwareDataPath: string,
  prefs: EditorPreferences,
): Promise<void> {
  await repository.save(softwareDataPath, prefs);
}
