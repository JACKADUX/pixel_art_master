import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLOR_VARIATION_ANALYSIS_PREFERENCES,
  parseColorVariationAnalysisPreferences,
} from "./ColorVariationAnalysisPreferences";

describe("parseColorVariationAnalysisPreferences", () => {
  it("returns lightness sort by default", () => {
    expect(parseColorVariationAnalysisPreferences(null)).toEqual(
      DEFAULT_COLOR_VARIATION_ANALYSIS_PREFERENCES,
    );
    expect(parseColorVariationAnalysisPreferences({})).toEqual(
      DEFAULT_COLOR_VARIATION_ANALYSIS_PREFERENCES,
    );
  });

  it("parses valid chart sort mode", () => {
    expect(parseColorVariationAnalysisPreferences({ chartSortMode: "hue" })).toEqual({
      chartSortMode: "hue",
    });
  });

  it("falls back to lightness for invalid sort mode", () => {
    expect(parseColorVariationAnalysisPreferences({ chartSortMode: "invalid" })).toEqual({
      chartSortMode: "lightness",
    });
  });
});
