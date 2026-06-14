import { colorsEqual, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import { formatPaletteColorTooltip } from "@/domain/palette/PaletteColorTooltip";
import type { ColorSlot } from "../stores/appStore";

interface ReferenceLayerColorStripProps {
  colors: readonly ColorEntry[];
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  onSelect: (slot: ColorSlot, color: PixelColor) => void;
}

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 6px 6px
  `;
}

export function ReferenceLayerColorStrip({
  colors,
  foregroundColor,
  backgroundColor,
  onSelect,
}: ReferenceLayerColorStripProps) {
  if (colors.length === 0) return null;

  return (
    <div
      className="pointer-events-auto mt-1 w-full rounded border border-zinc-700/80 bg-zinc-900/90 p-1"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap gap-0.5">
        {colors.map((entry) => {
          const isForeground = colorsEqual(foregroundColor, entry.color);
          const isBackground = colorsEqual(backgroundColor, entry.color);

          return (
            <button
              key={entry.hex}
              type="button"
              title={`${formatPaletteColorTooltip(entry.color, entry.hex)}\n左键设为前景色，右键设为背景色`}
              onClick={() => onSelect("foreground", entry.color)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect("background", entry.color);
              }}
              className={`h-3.5 w-3.5 shrink-0 rounded-sm border transition hover:ring-1 hover:ring-zinc-500/50 ${
                isForeground
                  ? "border-blue-400 ring-1 ring-blue-400"
                  : isBackground
                    ? "border-amber-400 ring-1 ring-amber-400"
                    : "border-zinc-600"
              }`}
              style={{ background: buildSwatchBackground(entry.hex) }}
            />
          );
        })}
      </div>
    </div>
  );
}
