import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeColorVariationChartLayout,
  formatChartPercentLabel,
} from "@/domain/colorAnalysis/ColorVariationChartLayout";
import type { ColorVariationPoint } from "@/domain/colorAnalysis/ColorVariationAnalysis";
import { shortestHueDelta } from "@/domain/colorAnalysis/ColorVariationAnalysis";
import {
  COLOR_VARIATION_CHART_SORT_OPTIONS,
  sortColorVariationPointsForChart,
} from "@/domain/colorAnalysis/ColorVariationChartSort";
import {
  useColorVariationAnalysisStore,
  type ColorVariationChannel,
} from "../../stores/colorVariationAnalysisStore";

/** 图表绘图区四周外边距（不贴边） */
const CHART_MARGIN = 24;
const TOOLTIP_OFFSET = 12;
/** 用于边界估算，实际宽度随内容自适应 */
const TOOLTIP_ESTIMATED_WIDTH = 240;

const CHANNEL_CONFIG: Record<
  ColorVariationChannel,
  { label: string; color: string; getValue: (point: ColorVariationPoint) => number }
> = {
  l: {
    label: "L",
    color: "#3b82f6",
    getValue: (point) => point.normalized.l,
  },
  c: {
    label: "C",
    color: "#22c55e",
    getValue: (point) => point.normalized.c,
  },
  h: {
    label: "H",
    color: "#f97316",
    getValue: (point) => point.normalized.h,
  },
};

const Y_TICKS = [0, 25, 50, 75, 100];

function buildPolyline(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function formatSignedDelta(delta: number | null, suffix = ""): string {
  if (delta === null) return "—";
  const rounded = Math.round(delta);
  if (rounded === 0) return `0${suffix}`;
  return rounded > 0 ? `+${rounded}${suffix}` : `${rounded}${suffix}`;
}

function findNearestPointIndex(
  mouseX: number,
  xAt: (index: number) => number,
  count: number,
): number {
  if (count <= 1) return 0;
  let nearest = 0;
  let minDistance = Infinity;
  for (let index = 0; index < count; index += 1) {
    const distance = Math.abs(xAt(index) - mouseX);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = index;
    }
  }
  return nearest;
}

function clampTooltipPosition(
  x: number,
  y: number,
  areaWidth: number,
  areaHeight: number,
): { left: number; top: number } {
  let left = x + TOOLTIP_OFFSET;
  let top = y + TOOLTIP_OFFSET;

  if (left + TOOLTIP_ESTIMATED_WIDTH > areaWidth - 8) {
    left = Math.max(8, x - TOOLTIP_ESTIMATED_WIDTH - TOOLTIP_OFFSET);
  }
  if (top + 160 > areaHeight - 8) {
    top = Math.max(8, y - 160 - TOOLTIP_OFFSET);
  }

  return { left: Math.max(8, left), top: Math.max(8, top) };
}

interface ChannelDeltaRow {
  label: string;
  value: string;
  leftDelta: string;
  rightDelta: string;
}

function buildChannelDeltaRows(
  point: ColorVariationPoint,
  prev: ColorVariationPoint | undefined,
  next: ColorVariationPoint | undefined,
  visibleChannels: { l: boolean; c: boolean; h: boolean },
): ChannelDeltaRow[] {
  const rows: ChannelDeltaRow[] = [];

  if (visibleChannels.l) {
    rows.push({
      label: "L",
      value: formatChartPercentLabel(point.normalized.l),
      leftDelta: formatSignedDelta(
        prev === undefined ? null : point.normalized.l - prev.normalized.l,
        "%",
      ),
      rightDelta: formatSignedDelta(
        next === undefined ? null : next.normalized.l - point.normalized.l,
        "%",
      ),
    });
  }

  if (visibleChannels.c) {
    rows.push({
      label: "C",
      value: formatChartPercentLabel(point.normalized.c),
      leftDelta: formatSignedDelta(
        prev === undefined ? null : point.normalized.c - prev.normalized.c,
        "%",
      ),
      rightDelta: formatSignedDelta(
        next === undefined ? null : next.normalized.c - point.normalized.c,
        "%",
      ),
    });
  }

  if (visibleChannels.h) {
    rows.push({
      label: "H",
      value: `${formatChartPercentLabel(point.normalized.h)} · ${Math.round(point.oklch.h)}°`,
      leftDelta: formatSignedDelta(
        prev === undefined ? null : shortestHueDelta(prev.oklch.h, point.oklch.h),
        "°",
      ),
      rightDelta: formatSignedDelta(
        next === undefined ? null : shortestHueDelta(point.oklch.h, next.oklch.h),
        "°",
      ),
    });
  }

  return rows;
}

interface ColorVariationChartProps {
  points: ColorVariationPoint[];
}

export function ColorVariationChart({ points }: ColorVariationChartProps) {
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const chartSortMode = useColorVariationAnalysisStore((s) => s.chartSortMode);
  const setChartSortMode = useColorVariationAnalysisStore((s) => s.setChartSortMode);
  const visibleChannels = useColorVariationAnalysisStore((s) => s.visibleChannels);
  const toggleChannel = useColorVariationAnalysisStore((s) => s.toggleChannel);

  const chartPoints = useMemo(
    () => sortColorVariationPointsForChart(points, chartSortMode),
    [points, chartSortMode],
  );

  useEffect(() => {
    setHoveredIndex(null);
    setMousePos(null);
  }, [chartSortMode, points]);

  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    const update = () => {
      setSize({
        width: chartArea.clientWidth,
        height: chartArea.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(chartArea);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => computeColorVariationChartLayout(size.width, size.height),
    [size.height, size.width],
  );

  const xAtIndex = useMemo(
    () => (index: number) => layout.xAt(index, chartPoints.length),
    [chartPoints.length, layout],
  );

  const channelLines = useMemo(() => {
    return (Object.keys(CHANNEL_CONFIG) as ColorVariationChannel[]).map((channel) => {
      const config = CHANNEL_CONFIG[channel];
      const linePoints = chartPoints.map((point, index) => ({
        x: xAtIndex(index),
        y: layout.valueToY(config.getValue(point)),
      }));
      return { channel, config, linePoints };
    });
  }, [chartPoints, layout, xAtIndex]);

  const hoveredPoint = hoveredIndex === null ? null : (chartPoints[hoveredIndex] ?? null);
  const prevPoint =
    hoveredIndex !== null && hoveredIndex > 0 ? chartPoints[hoveredIndex - 1] : undefined;
  const nextPoint =
    hoveredIndex !== null && hoveredIndex < chartPoints.length - 1
      ? chartPoints[hoveredIndex + 1]
      : undefined;

  const deltaRows =
    hoveredPoint === null
      ? []
      : buildChannelDeltaRows(hoveredPoint, prevPoint, nextPoint, visibleChannels);

  const handleChartMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePos({ x, y });
    setHoveredIndex(findNearestPointIndex(x, xAtIndex, chartPoints.length));
  };

  const handleChartMouseLeave = () => {
    setHoveredIndex(null);
    setMousePos(null);
  };

  if (points.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-xs text-zinc-500">
        在左侧添加颜色以查看 OKLCH 变化图表
      </div>
    );
  }

  const tooltipPosition =
    mousePos === null
      ? null
      : clampTooltipPosition(mousePos.x, mousePos.y, layout.chartWidth, layout.chartHeight);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 px-6 pt-6">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] text-zinc-500">排序</span>
          {COLOR_VARIATION_CHART_SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setChartSortMode(option.id)}
              className={`rounded px-2 py-1 text-[10px] transition ${
                chartSortMode === option.id
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-1 flex items-center gap-3">
        {(Object.keys(CHANNEL_CONFIG) as ColorVariationChannel[]).map((channel) => {
          const config = CHANNEL_CONFIG[channel];
          const active = visibleChannels[channel];
          return (
            <button
              key={channel}
              type="button"
              onClick={() => toggleChannel(channel)}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] ${
                active
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-400"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? config.color : "#52525b" }}
              />
              {config.label}
            </button>
          );
        })}
        <span className="ml-auto text-[10px] text-zinc-600">Y 轴：0–100%</span>
        </div>
      </div>

      <div
        ref={chartAreaRef}
        className="relative min-h-0 flex-1 overflow-visible"
        style={{ margin: CHART_MARGIN }}
      >
        <svg
          width={layout.chartWidth}
          height={layout.chartHeight}
          className="overflow-visible"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={handleChartMouseLeave}
        >
          <rect
            x={layout.plotLeft}
            y={layout.plotTop}
            width={layout.plotWidth}
            height={layout.plotHeight}
            fill="transparent"
            stroke="#3f3f46"
            strokeWidth={1}
          />

          {Y_TICKS.map((tick) => {
            const y = layout.valueToY(tick);
            return (
              <g key={tick}>
                <line
                  x1={layout.plotLeft}
                  y1={y}
                  x2={layout.plotLeft + layout.plotWidth}
                  y2={y}
                  stroke="#3f3f46"
                  strokeDasharray={tick === 0 || tick === 100 ? undefined : "4 4"}
                />
                <text
                  x={layout.plotLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize={10}
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {channelLines.map(({ channel, config, linePoints }) =>
            visibleChannels[channel] && linePoints.length > 1 ? (
              <polyline
                key={channel}
                points={buildPolyline(linePoints)}
                fill="none"
                stroke={config.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null,
          )}

          {chartPoints.map((point, index) => {
            const x = xAtIndex(index);
            const swatchY = layout.plotBottom + 28;
            const hexShort = point.hex.slice(0, 7);

            return (
              <g key={`${point.hex}-${point.index}`}>
                {visibleChannels.l && (
                  <circle
                    cx={x}
                    cy={layout.valueToY(point.normalized.l)}
                    r={hoveredIndex === index ? 4 : 3}
                    fill={CHANNEL_CONFIG.l.color}
                  />
                )}
                {visibleChannels.c && (
                  <circle
                    cx={x}
                    cy={layout.valueToY(point.normalized.c)}
                    r={hoveredIndex === index ? 4 : 3}
                    fill={CHANNEL_CONFIG.c.color}
                  />
                )}
                {visibleChannels.h && (
                  <circle
                    cx={x}
                    cy={layout.valueToY(point.normalized.h)}
                    r={hoveredIndex === index ? 4 : 3}
                    fill={CHANNEL_CONFIG.h.color}
                  />
                )}

                <rect
                  x={x - 10}
                  y={swatchY - 10}
                  width={20}
                  height={20}
                  rx={3}
                  fill={hexShort}
                  stroke={hoveredIndex === index ? "#e4e4e7" : "#52525b"}
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={swatchY + 22}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize={9}
                >
                  {point.index + 1}
                </text>
              </g>
            );
          })}

          {hoveredPoint && hoveredIndex !== null && (
            <>
              <line
                x1={xAtIndex(hoveredIndex)}
                y1={layout.plotTop}
                x2={xAtIndex(hoveredIndex)}
                y2={layout.plotBottom}
                stroke="#52525b"
                strokeDasharray="3 3"
              />
              {(Object.keys(CHANNEL_CONFIG) as ColorVariationChannel[]).map((channel) => {
                if (!visibleChannels[channel]) return null;
                const value = CHANNEL_CONFIG[channel].getValue(hoveredPoint);
                const y = layout.valueToY(value);
                return (
                  <line
                    key={`guide-${channel}`}
                    x1={layout.plotLeft}
                    y1={y}
                    x2={layout.plotLeft + layout.plotWidth}
                    y2={y}
                    stroke={CHANNEL_CONFIG[channel].color}
                    strokeOpacity={0.35}
                    strokeDasharray="4 4"
                  />
                );
              })}
            </>
          )}
        </svg>

        {hoveredPoint && hoveredIndex !== null && tooltipPosition && (
          <div
            className="pointer-events-none absolute z-10 w-max min-w-[10.5rem] max-w-none rounded border border-zinc-600 bg-zinc-900 px-2.5 py-2 text-[10px] text-zinc-200 shadow-lg"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
            }}
          >
            <div className="whitespace-nowrap font-medium">
              #{hoveredPoint.index + 1} · {hoveredPoint.hex.slice(0, 7)}
            </div>

            <div className="mt-2 grid grid-cols-[auto_auto_auto_auto] gap-x-2 gap-y-1 text-zinc-500">
              <span />
              <span />
              <span className="whitespace-nowrap text-right">左 Δ</span>
              <span className="whitespace-nowrap text-right">右 Δ</span>

              {deltaRows.map((row) => (
                <div key={row.label} className="contents">
                  <span className="whitespace-nowrap font-medium text-zinc-400">{row.label}</span>
                  <span className="whitespace-nowrap text-zinc-300">{row.value}</span>
                  <span
                    className={`whitespace-nowrap text-right ${
                      row.leftDelta.startsWith("+")
                        ? "text-green-400"
                        : row.leftDelta.startsWith("-")
                          ? "text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {row.leftDelta}
                  </span>
                  <span
                    className={`whitespace-nowrap text-right ${
                      row.rightDelta.startsWith("+")
                        ? "text-green-400"
                        : row.rightDelta.startsWith("-")
                          ? "text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {row.rightDelta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
