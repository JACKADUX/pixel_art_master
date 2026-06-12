import type { IEditorPreferencesRepository } from "@/application/ports/IEditorPreferencesRepository";
import {
  EDITOR_PREFERENCES_VERSION,
  type EditorPreferences,
} from "@/domain/preferences/EditorPreferences";

const STORAGE_KEY = "pixelart-editor-preferences";

interface SerializedEditorPreferencesV1 extends EditorPreferences {
  version: typeof EDITOR_PREFERENCES_VERSION;
}

export class LocalEditorPreferencesRepository implements IEditorPreferencesRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        (parsed as SerializedEditorPreferencesV1).version !== EDITOR_PREFERENCES_VERSION
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  save(prefs: EditorPreferences): void {
    try {
      const payload: SerializedEditorPreferencesV1 = {
        version: EDITOR_PREFERENCES_VERSION,
        ...prefs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const editorPreferencesRepository = new LocalEditorPreferencesRepository();
