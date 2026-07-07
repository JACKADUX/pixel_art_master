import {
  parseColorVariationChartSortMode,
  type ColorVariationChartSortMode,
} from "./ColorVariationChartSort";

export interface ColorVariationAnalysisPreferences {
  chartSortMode: ColorVariationChartSortMode;
}

export const COLOR_VARIATION_ANALYSIS_PREFERENCES_VERSION = 1;

export const DEFAULT_COLOR_VARIATION_ANALYSIS_PREFERENCES: ColorVariationAnalysisPreferences = {
  chartSortMode: "lightness",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseColorVariationAnalysisPreferences(
  raw: unknown,
): ColorVariationAnalysisPreferences {
  const defaults = DEFAULT_COLOR_VARIATION_ANALYSIS_PREFERENCES;
  if (!isRecord(raw)) return { ...defaults };

  return {
    chartSortMode: parseColorVariationChartSortMode(raw.chartSortMode),
  };
}

export function extractColorVariationAnalysisPreferences(
  source: ColorVariationAnalysisPreferences,
): ColorVariationAnalysisPreferences {
  return {
    chartSortMode: parseColorVariationChartSortMode(source.chartSortMode),
  };
}
