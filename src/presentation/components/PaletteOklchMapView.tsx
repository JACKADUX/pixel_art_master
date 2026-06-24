import { useEffect, useMemo, useRef, useState } from "react";
import { colorsEqual, type PixelColor } from "@/domain/canvas/PixelColor";
import { pixelColorToOklch } from "@/domain/color/ColorConverter";
import { OKLCH_MAX_CHROMA } from "@/domain/color/OklchColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import { formatPaletteColorTooltip } from "@/domain/palette/PaletteColorTooltip";
import { computePaletteOklchLayout } from "@/domain/palette/PaletteOklchLayout";
import type { ColorSlot } from "../stores/appStore";
import { PaletteSaturationRing } from "./PaletteSaturationRing";

interface PaletteOklchMapViewProps {
  colors: readonly ColorEntry[];
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  onSelect: (slot: ColorSlot, color: PixelColor) => void;
  removeMode?: boolean;
  selectedHexes?: ReadonlySet<string>;
  onToggleRemoveSelect?: (hex: string) => void;
  readOnly?: boolean;
  className?: string;
}

function buildPaletteCircleBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function PaletteOklchMapView({
  colors,
  foregroundColor,
  backgroundColor,
  onSelect,
  removeMode = false,
  selectedHexes,
  onToggleRemoveSelect,
  readOnly = false,
  className = "",
}: PaletteOklchMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const colorByHex = useMemo(
    () => new Map(colors.map((entry) => [entry.hex, entry])),
    [colors],
  );

  const layout = useMemo(() => {
    const inputs = colors.map((entry) => {
      const oklch = pixelColorToOklch(entry.color);
      return {
        id: entry.hex,
        hue: oklch.h,
        lightness: oklch.l,
      };
    });

    return computePaletteOklchLayout(inputs, size.width, size.height);
  }, [colors, size.height, size.width]);

  return (
    <div className={`relative min-h-0 flex-1 overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-1 py-1 text-[10px] text-zinc-600">
        <span>L</span>
        <span className="self-end">H</span>
      </div>
      <div ref={containerRef} className="absolute inset-0">
        {layout.map((circle) => {
          const entry = colorByHex.get(circle.id);
          if (!entry) return null;

          const diameter = circle.radius * 2;
          const isSelectedForRemoval = !readOnly && removeMode && selectedHexes?.has(entry.hex);
          const isForeground =
            !readOnly && !removeMode && colorsEqual(foregroundColor, entry.color);
          const isBackground =
            !readOnly && !removeMode && colorsEqual(backgroundColor, entry.color);

          const tooltip = readOnly
            ? formatPaletteColorTooltip(entry.color, entry.hex)
            : removeMode
              ? `${formatPaletteColorTooltip(entry.color, entry.hex)}\n点击选择/取消选择`
              : `${formatPaletteColorTooltip(entry.color, entry.hex)}\n左键设为前景色，右键设为背景色`;

          const displaySaturation = (pixelColorToOklch(entry.color).c / OKLCH_MAX_CHROMA) * 100;

          const circleClassName = `absolute overflow-hidden rounded-full border ${
            readOnly ? "border-zinc-600" : "transition hover:ring-1 hover:ring-zinc-500/50"
          } ${
            isSelectedForRemoval
              ? "border-red-400 ring-2 ring-red-400"
              : isForeground
                ? "border-blue-400 ring-1 ring-blue-400"
                : isBackground
                  ? "border-amber-400 ring-1 ring-amber-400"
                  : "border-zinc-600"
          }`;

          const circleStyle = {
            width: diameter,
            height: diameter,
            left: circle.x - circle.radius,
            top: circle.y - circle.radius,
            background: buildPaletteCircleBackground(entry.hex),
          };

          if (readOnly) {
            return (
              <div
                key={circle.id}
                title={tooltip}
                className={circleClassName}
                style={circleStyle}
              >
                <PaletteSaturationRing saturation={displaySaturation} diameter={diameter} />
              </div>
            );
          }

          return (
            <button
              key={circle.id}
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
              className={circleClassName}
              style={circleStyle}
            >
              <PaletteSaturationRing saturation={displaySaturation} diameter={diameter} />
              {isSelectedForRemoval && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
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
