export type ColorPickerLayoutOrientation = "vertical" | "horizontal";
export const COLOR_PICKER_LAYOUT_ORIENTATIONS: ColorPickerLayoutOrientation[] = [
  "vertical",
  "horizontal",
];

export const COLOR_PICKER_VERTICAL_WIDTH = 240;
export const COLOR_PICKER_PREVIEW_SIZE = 28;
export const COLOR_PICKER_HORIZONTAL_LEFT_WIDTH = 72;
export const COLOR_PICKER_HORIZONTAL_SLIDER_WIDTH = 224;
/** 单行滑条高度（与 ColorChannelSlider 行高一致） */
export const COLOR_PICKER_HORIZONTAL_SLIDER_ROW_HEIGHT = 20;
export const COLOR_PICKER_HORIZONTAL_SLIDER_GAP = 8;
export const COLOR_PICKER_HORIZONTAL_SLIDER_COUNT = 4;
/** 水平模式内容区高度：滑条列自然高度，选色区与之对齐 */
export const COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT =
  COLOR_PICKER_HORIZONTAL_SLIDER_COUNT * COLOR_PICKER_HORIZONTAL_SLIDER_ROW_HEIGHT +
  (COLOR_PICKER_HORIZONTAL_SLIDER_COUNT - 1) * COLOR_PICKER_HORIZONTAL_SLIDER_GAP;
export const COLOR_PICKER_HORIZONTAL_PLANE_WIDTH = COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT;
export const COLOR_PICKER_HORIZONTAL_WIDTH =
  COLOR_PICKER_HORIZONTAL_LEFT_WIDTH +
  COLOR_PICKER_HORIZONTAL_PLANE_WIDTH +
  COLOR_PICKER_HORIZONTAL_SLIDER_WIDTH +
  24 +
  24;
export const COLOR_PICKER_HORIZONTAL_MIN_HEIGHT = COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT + 24;
export const COLOR_PICKER_HEADER_HEIGHT = 28;

/** 选色平面宽高比（宽 / 高） */
export const COLOR_PICKER_PLANE_ASPECT = {
  vertical: { width: 3, height: 2 },
  horizontal: { width: 1, height: 1 },
} as const;

export function getColorPickerPlaneAspectRatio(
  orientation: ColorPickerLayoutOrientation,
): string {
  const aspect = COLOR_PICKER_PLANE_ASPECT[orientation];
  return `${aspect.width} / ${aspect.height}`;
}

export function estimateColorPickerPlaneHeight(
  orientation: ColorPickerLayoutOrientation,
  planeWidth: number,
): number {
  const aspect = COLOR_PICKER_PLANE_ASPECT[orientation];
  return Math.round((planeWidth * aspect.height) / aspect.width);
}

export function getDefaultColorPickerPanelWidth(
  orientation: ColorPickerLayoutOrientation,
): number {
  return orientation === "horizontal"
    ? COLOR_PICKER_HORIZONTAL_WIDTH
    : COLOR_PICKER_VERTICAL_WIDTH;
}

export function getEstimatedColorPickerPanelHeight(
  orientation: ColorPickerLayoutOrientation,
): number {
  if (orientation === "horizontal") {
    return COLOR_PICKER_HORIZONTAL_MIN_HEIGHT;
  }
  const contentWidth = COLOR_PICKER_VERTICAL_WIDTH - 24;
  return estimateColorPickerPlaneHeight("vertical", contentWidth) + 280;
}
