import { colorsEqual, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import { formatPaletteColorTooltip } from "@/domain/palette/PaletteColorTooltip";
import type { ColorSlot } from "../stores/appStore";
import {
  handlePaletteBlankAreaClick,
  handlePaletteBlankAreaContextMenu,
  PALETTE_BLANK_AREA_TOOLTIP,
} from "./paletteBlankAreaHandlers";

interface PaletteGridViewProps {
  colors: readonly ColorEntry[];
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  onSelect: (slot: ColorSlot, color: PixelColor) => void;
  removeMode?: boolean;
  selectedHexes?: ReadonlySet<string>;
  onToggleRemoveSelect?: (hex: string) => void;
}

function buildPaletteSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function PaletteGridView({
  colors,
  foregroundColor,
  backgroundColor,
  onSelect,
  removeMode = false,
  selectedHexes,
  onToggleRemoveSelect,
}: PaletteGridViewProps) {
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${removeMode ? "" : "cursor-pointer"}`}
      title={removeMode ? undefined : PALETTE_BLANK_AREA_TOOLTIP}
      onClick={(event) => handlePaletteBlankAreaClick(event, removeMode, onSelect)}
      onContextMenu={(event) => handlePaletteBlankAreaContextMenu(event, removeMode, onSelect)}
    >
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(1.375rem,1fr))] gap-1">
        {colors.map((entry) => {
          const isSelectedForRemoval = removeMode && selectedHexes?.has(entry.hex);
          const isForeground = !removeMode && colorsEqual(foregroundColor, entry.color);
          const isBackground = !removeMode && colorsEqual(backgroundColor, entry.color);

          const tooltip = removeMode
            ? `${formatPaletteColorTooltip(entry.color, entry.hex)}\n点击选择/取消选择`
            : `${formatPaletteColorTooltip(entry.color, entry.hex)}\n左键设为前景色，右键设为背景色`;

          return (
            <button
              key={entry.hex}
              type="button"
              title={tooltip}
              onClick={() => {
                if (removeMode) {
                  onToggleRemoveSelect?.(entry.hex);
                  return;
                }
                onSelect("foreground", entry.color);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (removeMode) return;
                onSelect("background", entry.color);
              }}
              className={`relative aspect-square min-h-[1.375rem] w-full rounded-sm border transition hover:ring-1 hover:ring-zinc-500/50 ${
                isSelectedForRemoval
                  ? "border-red-400 ring-2 ring-red-400"
                  : isForeground
                    ? "border-blue-400 ring-1 ring-blue-400"
                    : isBackground
                      ? "border-amber-400 ring-1 ring-amber-400"
                      : "border-zinc-600"
              }`}
              style={{ background: buildPaletteSwatchBackground(entry.hex) }}
            >
              {isSelectedForRemoval && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
