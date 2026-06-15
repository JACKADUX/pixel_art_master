import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import { formatMergeColorSwatchTooltip } from "@/domain/colorEdit/MergeColorTooltip";
import type { ColorEntry } from "@/domain/palette/Palette";

interface ColorPalettePreviewProps {
  label: string;
  stats: ColorPaletteStats | null;
  onColorClick?: (color: PixelColor) => void;
}

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

function ColorSwatchGrid({
  colors,
  onColorClick,
}: {
  colors: readonly ColorEntry[];
  onColorClick?: (color: PixelColor) => void;
}) {
  if (colors.length === 0) {
    return <p className="text-[10px] text-zinc-600">暂无颜色</p>;
  }

  return (
    <div className="grid max-h-24 grid-cols-[repeat(auto-fill,minmax(1.125rem,1fr))] gap-1 overflow-y-auto">
      {colors.map((entry) =>
        onColorClick ? (
          <button
            key={entry.hex}
            type="button"
            title={`${formatMergeColorSwatchTooltip(entry.color, entry.hex)}\n点击添加为锚点`}
            onClick={() => onColorClick(entry.color)}
            className="aspect-square min-h-[1.125rem] rounded-sm border border-zinc-600 transition hover:ring-1 hover:ring-blue-500/60"
            style={{ background: buildSwatchBackground(entry.hex) }}
          />
        ) : (
          <div
            key={entry.hex}
            title={formatMergeColorSwatchTooltip(entry.color, entry.hex)}
            className="aspect-square min-h-[1.125rem] rounded-sm border border-zinc-600"
            style={{ background: buildSwatchBackground(entry.hex) }}
          />
        ),
      )}
    </div>
  );
}

export function ColorPalettePreview({ label, stats, onColorClick }: ColorPalettePreviewProps) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-zinc-400">{label}</span>
        <span className="text-[11px] text-zinc-500">
          {stats ? `${stats.uniqueCount} 色` : "—"}
        </span>
      </div>
      <ColorSwatchGrid colors={stats?.colors ?? []} onColorClick={onColorClick} />
    </div>
  );
}
