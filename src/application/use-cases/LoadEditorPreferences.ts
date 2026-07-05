import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/domain/preferences/EditorPreferences";
import type { IEditorPreferencesRepository } from "../ports/IEditorPreferencesRepository";

export async function loadEditorPreferences(
  repository: IEditorPreferencesRepository,
  softwareDataPath: string,
): Promise<EditorPreferences | null> {
  const raw = await repository.load(softwareDataPath);
  if (raw === null) return null;
  return parseEditorPreferences(raw);
}
