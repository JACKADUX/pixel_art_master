import {
  parseColorEditPreferences,
  type ColorEditPreferences,
} from "@/domain/colorEdit/ColorEditPreferences";
import type { IColorEditPreferencesRepository } from "../ports/IColorEditPreferencesRepository";

export async function loadColorEditPreferences(
  repository: IColorEditPreferencesRepository,
  softwareDataPath: string,
): Promise<ColorEditPreferences | null> {
  const raw = await repository.load(softwareDataPath);
  if (raw === null) return null;
  return parseColorEditPreferences(raw);
}
