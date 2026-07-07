import type { IColorVariationAnalysisPreferencesRepository } from "@/application/ports/IColorVariationAnalysisPreferencesRepository";
import {
  COLOR_VARIATION_ANALYSIS_PREFERENCES_VERSION,
  type ColorVariationAnalysisPreferences,
} from "@/domain/colorAnalysis/ColorVariationAnalysisPreferences";
import { buildColorVariationAnalysisPreferencesPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedColorVariationAnalysisPreferences extends ColorVariationAnalysisPreferences {
  version: number;
}

export class FileColorVariationAnalysisPreferencesRepository
  implements IColorVariationAnalysisPreferencesRepository
{
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(
      buildColorVariationAnalysisPreferencesPath(softwareDataPath),
    );
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedColorVariationAnalysisPreferences).version;
    if (version !== COLOR_VARIATION_ANALYSIS_PREFERENCES_VERSION) {
      return null;
    }

    return parsed;
  }

  async save(softwareDataPath: string, prefs: ColorVariationAnalysisPreferences): Promise<void> {
    const payload: SerializedColorVariationAnalysisPreferences = {
      version: COLOR_VARIATION_ANALYSIS_PREFERENCES_VERSION,
      ...prefs,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildColorVariationAnalysisPreferencesPath(softwareDataPath),
      payload,
    );
  }
}

export const colorVariationAnalysisPreferencesRepository =
  new FileColorVariationAnalysisPreferencesRepository();
