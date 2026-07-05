import type { IEditorPreferencesRepository } from "@/application/ports/IEditorPreferencesRepository";
import {
  EDITOR_PREFERENCES_VERSION,
  type EditorPreferences,
} from "@/domain/preferences/EditorPreferences";
import { buildEditorPreferencesPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedEditorPreferencesV1 extends EditorPreferences {
  version: typeof EDITOR_PREFERENCES_VERSION;
}

export class FileEditorPreferencesRepository implements IEditorPreferencesRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildEditorPreferencesPath(softwareDataPath));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as SerializedEditorPreferencesV1).version !== EDITOR_PREFERENCES_VERSION
    ) {
      return null;
    }
    return parsed;
  }

  async save(softwareDataPath: string, prefs: EditorPreferences): Promise<void> {
    const payload: SerializedEditorPreferencesV1 = {
      version: EDITOR_PREFERENCES_VERSION,
      ...prefs,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildEditorPreferencesPath(softwareDataPath),
      payload,
    );
  }
}

export const editorPreferencesRepository = new FileEditorPreferencesRepository();
