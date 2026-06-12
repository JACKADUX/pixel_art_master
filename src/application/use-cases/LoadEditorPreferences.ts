import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/domain/preferences/EditorPreferences";
import type { IEditorPreferencesRepository } from "../ports/IEditorPreferencesRepository";

export function loadEditorPreferences(
  repository: IEditorPreferencesRepository,
): EditorPreferences | null {
  const raw = repository.load();
  if (raw === null) return null;
  return parseEditorPreferences(raw);
}
