import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import { formatMergeColorSwatchTooltip } from "@/domain/colorEdit/MergeColorTooltip";
import type { ColorEntry } from "@/domain/palette/Palette";

interface ColorPalettePreviewProps {
  label: string;
  stats: ColorPaletteStats | null;
  activeCount?: number | null;
  disabledColors?: readonly PixelColor[];
  onColorClick?: (color: PixelColor) => void;
  onColorRightClick?: (color: PixelColor) => void;
}

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

function formatPaletteCount(stats: ColorPaletteStats | null, activeCount?: number | null): string {
  if (!stats) return "—";
  const count = activeCount ?? stats.uniqueCount;
  return `${count} 色`;
}

function ColorSwatchGrid({
  colors,
  disabledColors,
  onColorClick,
  onColorRightClick,
}: {
  colors: readonly ColorEntry[];
  disabledColors?: readonly PixelColor[];
  onColorClick?: (color: PixelColor) => void;
  onColorRightClick?: (color: PixelColor) => void;
}) {
  if (colors.length === 0) {
    return <p className="text-[10px] text-zinc-600">暂无颜色</p>;
  }

  const disabledSet = disabledColors ? new Set(disabledColors) : null;

  return (
    <div className="grid max-h-24 grid-cols-[repeat(auto-fill,minmax(1.125rem,1fr))] gap-1 overflow-y-auto">
      {colors.map((entry) => {
        const isDisabled = disabledSet?.has(entry.color) ?? false;
        const tooltipLines = [formatMergeColorSwatchTooltip(entry.color, entry.hex)];
        if (onColorClick) {
          tooltipLines.push("点击添加为锚点");
        }
        if (onColorRightClick) {
          tooltipLines.push(isDisabled ? "右键恢复此颜色" : "右键禁用此颜色");
        }
        const tooltip = tooltipLines.join("\n");

        if (onColorClick || onColorRightClick) {
          return (
            <button
              key={entry.hex}
              type="button"
              title={tooltip}
              onClick={onColorClick ? () => onColorClick(entry.color) : undefined}
              onContextMenu={
                onColorRightClick
                  ? (event) => {
                      event.preventDefault();
                      onColorRightClick(entry.color);
                    }
                  : undefined
              }
              className={`relative aspect-square min-h-[1.125rem] rounded-sm border transition hover:ring-1 ${
                isDisabled
                  ? "border-zinc-700 opacity-40 hover:ring-zinc-500/60"
                  : "border-zinc-600 hover:ring-blue-500/60"
              }`}
              style={{ background: buildSwatchBackground(entry.hex) }}
            >
              {isDisabled && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-sm bg-zinc-950/35"
                  aria-hidden
                />
              )}
            </button>
          );
        }

        return (
          <div
            key={entry.hex}
            title={tooltip}
            className="aspect-square min-h-[1.125rem] rounded-sm border border-zinc-600"
            style={{ background: buildSwatchBackground(entry.hex) }}
          />
        );
      })}
    </div>
  );
}

export function ColorPalettePreview({
  label,
  stats,
  activeCount,
  disabledColors,
  onColorClick,
  onColorRightClick,
}: ColorPalettePreviewProps) {
  const disabledCount = disabledColors?.length ?? 0;
  const countLabel = formatPaletteCount(stats, activeCount);
  const countSuffix = disabledCount > 0 ? ` · ${disabledCount} 已禁用` : "";

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-zinc-400">{label}</span>
        <span className="text-[11px] text-zinc-500">
          {stats ? `${countLabel}${countSuffix}` : "—"}
        </span>
      </div>
      <ColorSwatchGrid
        colors={stats?.colors ?? []}
        disabledColors={disabledColors}
        onColorClick={onColorClick}
        onColorRightClick={onColorRightClick}
      />
    </div>
  );
}
