import type { ColorVariationAnalysisPreferences } from "@/domain/colorAnalysis/ColorVariationAnalysisPreferences";

export interface IColorVariationAnalysisPreferencesRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, prefs: ColorVariationAnalysisPreferences): Promise<void>;
}
