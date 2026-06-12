import type { EditorPreferences } from "@/domain/preferences/EditorPreferences";
import type { IEditorPreferencesRepository } from "../ports/IEditorPreferencesRepository";

export function saveEditorPreferences(
  repository: IEditorPreferencesRepository,
  prefs: EditorPreferences,
): void {
  repository.save(prefs);
}
