export type ColorPickerLayoutOrientation = "vertical" | "horizontal";
export const COLOR_PICKER_LAYOUT_ORIENTATIONS: ColorPickerLayoutOrientation[] = [
  "vertical",
  "horizontal",
];

export const COLOR_PICKER_VERTICAL_WIDTH = 280;
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
  COLOR_PICKER_HORIZONTAL_PLANE_WIDTH +
  COLOR_PICKER_HORIZONTAL_SLIDER_WIDTH +
  36;
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

/** 悬浮/弹窗面板的完整高度（含标题栏） */
export function getEstimatedColorPickerPanelHeight(
  orientation: ColorPickerLayoutOrientation,
): number {
  const contentHeight =
    orientation === "horizontal"
      ? COLOR_PICKER_HORIZONTAL_MIN_HEIGHT
      : estimateColorPickerPlaneHeight("vertical", COLOR_PICKER_VERTICAL_WIDTH - 24) + 236;
  return contentHeight + COLOR_PICKER_HEADER_HEIGHT;
}

/** 悬浮色彩选择器边界计算用的面板尺寸（随布局方向变化） */
export function getFloatingColorPickerPanelDimensions(
  orientation: ColorPickerLayoutOrientation,
): { width: number; height: number } {
  return {
    width: getDefaultColorPickerPanelWidth(orientation),
    height: getEstimatedColorPickerPanelHeight(orientation),
  };
}
