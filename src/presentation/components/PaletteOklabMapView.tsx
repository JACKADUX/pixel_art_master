import { useEffect, useMemo, useRef, useState } from "react";
import { toHex, type PixelColor } from "@/domain/canvas/PixelColor";
import { pixelColorToOklabPolar } from "@/domain/color/ColorConverter";
import type { ColorEntry } from "@/domain/palette/Palette";
import { formatPaletteColorTooltip } from "@/domain/palette/PaletteColorTooltip";
import { computePaletteOklabLayout } from "@/domain/palette/PaletteOklabLayout";
import { PaletteSaturationRing } from "./PaletteSaturationRing";

interface PaletteOklabMapViewProps {
  colors: readonly ColorEntry[];
  currentColor: PixelColor;
  onSelect: (color: PixelColor) => void;
}

export function PaletteOklabMapView({ colors, currentColor, onSelect }: PaletteOklabMapViewProps) {
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

  const polarByHex = useMemo(
    () =>
      new Map(
        colors.map((entry) => [entry.hex, pixelColorToOklabPolar(entry.color)]),
      ),
    [colors],
  );

  const layout = useMemo(() => {
    const inputs = colors.map((entry) => {
      const polar = pixelColorToOklabPolar(entry.color);
      return {
        id: entry.hex,
        hue: polar.h,
        lightness: polar.l,
      };
    });

    return computePaletteOklabLayout(inputs, size.width, size.height);
  }, [colors, size.height, size.width]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-1 py-1 text-[10px] text-zinc-600">
        <span>L</span>
        <span className="self-end">H</span>
      </div>
      <div ref={containerRef} className="absolute inset-0">
        {layout.map((circle) => {
          const entry = colorByHex.get(circle.id);
          if (!entry) return null;

          const polar = polarByHex.get(circle.id);
          if (!polar) return null;

          const diameter = circle.radius * 2;

          return (
            <button
              key={circle.id}
              type="button"
              title={formatPaletteColorTooltip(entry.color, entry.hex)}
              onClick={() => onSelect(entry.color)}
              className={`absolute overflow-hidden rounded-full border transition hover:ring-1 hover:ring-zinc-500/50 ${
                toHex(currentColor) === entry.hex
                  ? "border-blue-400 ring-1 ring-blue-400"
                  : "border-zinc-600"
              }`}
              style={{
                width: diameter,
                height: diameter,
                left: circle.x - circle.radius,
                top: circle.y - circle.radius,
                backgroundColor: entry.hex,
              }}
            >
              <PaletteSaturationRing saturation={polar.s} diameter={diameter} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
