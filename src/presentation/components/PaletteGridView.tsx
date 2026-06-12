import { toHex, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import { formatPaletteColorTooltip } from "@/domain/palette/PaletteColorTooltip";

interface PaletteGridViewProps {
  colors: readonly ColorEntry[];
  currentColor: PixelColor;
  onSelect: (color: PixelColor) => void;
}

export function PaletteGridView({ colors, currentColor, onSelect }: PaletteGridViewProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(1.375rem,1fr))] gap-1">
        {colors.map((entry) => (
          <button
            key={entry.hex}
            type="button"
            title={formatPaletteColorTooltip(entry.color, entry.hex)}
            onClick={() => onSelect(entry.color)}
            className={`aspect-square min-h-[1.375rem] w-full rounded-sm border transition hover:ring-1 hover:ring-zinc-500/50 ${
              toHex(currentColor) === entry.hex
                ? "border-blue-400 ring-1 ring-blue-400"
                : "border-zinc-600"
            }`}
            style={{ backgroundColor: entry.hex }}
          />
        ))}
      </div>
    </div>
  );
}
