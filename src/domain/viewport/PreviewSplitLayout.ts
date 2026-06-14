export type PreviewSplitDirection = "horizontal" | "vertical";

export function resolvePreviewSplitDirection(
  width: number,
  height: number,
): PreviewSplitDirection {
  if (width <= 0 || height <= 0) return "vertical";
  return width >= height ? "horizontal" : "vertical";
}
