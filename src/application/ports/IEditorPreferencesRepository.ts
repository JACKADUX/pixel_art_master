import type { EditorPreferences } from "@/domain/preferences/EditorPreferences";

export interface IEditorPreferencesRepository {
  load(): unknown | null;
  save(prefs: EditorPreferences): void;
}
