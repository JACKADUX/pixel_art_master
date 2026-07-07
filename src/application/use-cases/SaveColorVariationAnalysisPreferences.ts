import type { ColorVariationAnalysisPreferences } from "@/domain/colorAnalysis/ColorVariationAnalysisPreferences";
import type { IColorVariationAnalysisPreferencesRepository } from "../ports/IColorVariationAnalysisPreferencesRepository";

export async function saveColorVariationAnalysisPreferences(
  repository: IColorVariationAnalysisPreferencesRepository,
  softwareDataPath: string,
  prefs: ColorVariationAnalysisPreferences,
): Promise<void> {
  await repository.save(softwareDataPath, prefs);
}
