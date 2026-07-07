import {
  analyzeColorVariation,
  parseColorListInput,
  type ColorVariationSeries,
} from "@/domain/colorAnalysis/ColorVariationAnalysis";
import type { ColorEntry } from "@/domain/palette/Palette";

export function analyzeColorVariationFromText(content: string): ColorVariationSeries {
  return analyzeColorVariation(parseColorListInput(content));
}

export function analyzeColorVariationFromEntries(entries: ColorEntry[]): ColorVariationSeries {
  return analyzeColorVariation(entries);
}
