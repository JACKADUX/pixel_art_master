import {
  parseColorVariationAnalysisPreferences,
  type ColorVariationAnalysisPreferences,
} from "@/domain/colorAnalysis/ColorVariationAnalysisPreferences";
import type { IColorVariationAnalysisPreferencesRepository } from "../ports/IColorVariationAnalysisPreferencesRepository";

export async function loadColorVariationAnalysisPreferences(
  repository: IColorVariationAnalysisPreferencesRepository,
  softwareDataPath: string,
): Promise<ColorVariationAnalysisPreferences | null> {
  const raw = await repository.load(softwareDataPath);
  if (raw === null) return null;
  return parseColorVariationAnalysisPreferences(raw);
}
