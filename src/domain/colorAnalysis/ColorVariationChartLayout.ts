export interface ColorVariationChartLayout {
  chartWidth: number;
  chartHeight: number;
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  plotBottom: number;
  valueToY: (percent: number) => number;
  xAt: (index: number, count: number) => number;
}

export interface ColorVariationChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_COLOR_VARIATION_CHART_PADDING: ColorVariationChartPadding = {
  top: 48,
  right: 24,
  bottom: 96,
  left: 48,
};

export function clampChartPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** 与 Y 轴刻度一致：四舍五入到整数百分比，避免显示值与节点位置偏差。 */
export function formatChartPercent(value: number): number {
  return Math.round(clampChartPercent(value));
}

export function formatChartPercentLabel(value: number): string {
  return `${formatChartPercent(value)}%`;
}

export function computeColorVariationChartLayout(
  measuredWidth: number,
  measuredHeight: number,
  padding: ColorVariationChartPadding = DEFAULT_COLOR_VARIATION_CHART_PADDING,
  minChartHeight = 200,
): ColorVariationChartLayout {
  const chartWidth = Math.max(0, measuredWidth);
  const chartHeight = Math.max(minChartHeight, measuredHeight);
  const plotLeft = padding.left;
  const plotTop = padding.top;
  const plotWidth = Math.max(0, chartWidth - padding.left - padding.right);
  const plotBottom = chartHeight - padding.bottom;
  const plotHeight = Math.max(0, plotBottom - plotTop);

  const valueToY = (percent: number) => {
    const normalized = formatChartPercent(percent);
    return plotTop + plotHeight * (1 - normalized / 100);
  };

  const xAt = (index: number, count: number) => {
    if (count <= 1) return plotLeft + plotWidth / 2;
    return plotLeft + (index / (count - 1)) * plotWidth;
  };

  return {
    chartWidth,
    chartHeight,
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    plotBottom,
    valueToY,
    xAt,
  };
}
