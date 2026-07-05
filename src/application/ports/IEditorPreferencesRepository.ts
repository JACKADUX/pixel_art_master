import type { EditorPreferences } from "@/domain/preferences/EditorPreferences";

export interface IEditorPreferencesRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, prefs: EditorPreferences): Promise<void>;
}
