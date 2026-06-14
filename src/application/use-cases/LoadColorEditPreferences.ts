import {
  parseColorEditPreferences,
  type ColorEditPreferences,
} from "@/domain/colorEdit/ColorEditPreferences";
import type { IColorEditPreferencesRepository } from "../ports/IColorEditPreferencesRepository";

export function loadColorEditPreferences(
  repository: IColorEditPreferencesRepository,
): ColorEditPreferences | null {
  const raw = repository.load();
  if (raw === null) return null;
  return parseColorEditPreferences(raw);
}
