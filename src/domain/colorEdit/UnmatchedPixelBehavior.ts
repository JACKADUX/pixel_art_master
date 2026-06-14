export type UnmatchedPixelBehavior = "remove" | "keep";

export const UNMATCHED_PIXEL_BEHAVIORS: UnmatchedPixelBehavior[] = ["remove", "keep"];

export const DEFAULT_UNMATCHED_PIXEL_BEHAVIOR: UnmatchedPixelBehavior = "remove";

export function parseUnmatchedPixelBehavior(value: unknown): UnmatchedPixelBehavior {
  return UNMATCHED_PIXEL_BEHAVIORS.includes(value as UnmatchedPixelBehavior)
    ? (value as UnmatchedPixelBehavior)
    : DEFAULT_UNMATCHED_PIXEL_BEHAVIOR;
}
