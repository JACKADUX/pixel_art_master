import type { OklabColor } from "../color/OklabColor";
import { OKLAB_MAX_CHROMA } from "../color/OklabColor";
import type { OklabMergeOptions } from "./OklabMergeOptions";

export const WEIGHT_L = 1.35;
export const WEIGHT_A = 1.0;
export const WEIGHT_B = 0.875;

export const HARD_L_LIMIT = 0.06;

export const DARK_THRESHOLD_L_START = 0.05;
export const DARK_THRESHOLD_L_END = 0.25;

export const CHROMA_THRESHOLD_C_START = 0.15;
export const CHROMA_THRESHOLD_C_END = 0.35;

export const MIN_OKLAB_MERGE_THRESHOLD = 0.02;
export const MAX_OKLAB_MERGE_THRESHOLD = 0.05;
export const DEFAULT_OKLAB_MERGE_THRESHOLD = 0.035;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function oklabChroma(c: OklabColor): number {
  return Math.sqrt(c.a * c.a + c.b * c.b);
}

export function oklabChromaNormalized(c: OklabColor): number {
  return oklabChroma(c) / OKLAB_MAX_CHROMA;
}

export function weightedDeltaE(a: OklabColor, b: OklabColor): number {
  const dL = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(WEIGHT_L * dL * dL + WEIGHT_A * da * da + WEIGHT_B * db * db);
}

/** 低明度时缩小有效阈值，使暗部合并更严格。 */
export function darkFactor(minL: number): number {
  return 0.5 + 0.5 * smoothstep(DARK_THRESHOLD_L_START, DARK_THRESHOLD_L_END, minL);
}

/** 高色度时缩小有效阈值，使高饱和色合并更严格。 */
export function chromaFactor(maxChromaNormalized: number): number {
  const t = smoothstep(
    CHROMA_THRESHOLD_C_START,
    CHROMA_THRESHOLD_C_END,
    maxChromaNormalized,
  );
  return 1 - t * 0.4;
}

export function effectiveOklabMergeThreshold(
  a: OklabColor,
  b: OklabColor,
  baseThreshold: number,
): number {
  const minL = Math.min(a.l, b.l);
  const maxChromaNorm = Math.max(oklabChromaNormalized(a), oklabChromaNormalized(b));
  return baseThreshold * darkFactor(minL) * chromaFactor(maxChromaNorm);
}

export function canMergeOklabColors(
  a: OklabColor,
  b: OklabColor,
  options: Pick<OklabMergeOptions, "threshold">,
): boolean {
  if (Math.abs(a.l - b.l) > HARD_L_LIMIT) return false;
  const deltaE = weightedDeltaE(a, b);
  const effectiveThreshold = effectiveOklabMergeThreshold(a, b, options.threshold);
  return deltaE < effectiveThreshold;
}

export function clampOklabMergeThreshold(value: number): number {
  return Math.min(MAX_OKLAB_MERGE_THRESHOLD, Math.max(MIN_OKLAB_MERGE_THRESHOLD, value));
}
