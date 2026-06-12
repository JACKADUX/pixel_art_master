import { toHexAlpha, withAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorMode } from "@/domain/color/ColorMode";
import { hslToRgb, oklabToRgb, rgbToHex } from "@/domain/color/ColorConverter";
import { createHsl } from "@/domain/color/HslColor";
import { createOklabPolar, polarToOklab } from "@/domain/color/OklabPolarColor";
import { useColorPickerState } from "@/presentation/hooks/useColorPickerState";
import { ColorChannelSlider } from "./ColorChannelSlider";
import { ColorSelectionPlane } from "./ColorSelectionPlane";
import { OklabSelectionPlane } from "./OklabSelectionPlane";

interface ColorPickerPanelProps {
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
}

function buildHueGradient(): string {
  const stops = [0, 60, 120, 180, 240, 300, 360].map((h) => {
    const { r, g, b } = hslToRgb(createHsl(h, 100, 50));
    return `${rgbToHex(r, g, b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function buildHslSaturationGradient(h: number, l: number): string {
  const low = hslToRgb(createHsl(h, 0, l));
  const high = hslToRgb(createHsl(h, 100, l));
  return `linear-gradient(to right, ${rgbToHex(low.r, low.g, low.b)}, ${rgbToHex(high.r, high.g, high.b)})`;
}

function buildHslLightnessGradient(h: number, s: number): string {
  const dark = hslToRgb(createHsl(h, s, 0));
  const mid = hslToRgb(createHsl(h, s, 50));
  const light = hslToRgb(createHsl(h, s, 100));
  return `linear-gradient(to right, ${rgbToHex(dark.r, dark.g, dark.b)}, ${rgbToHex(mid.r, mid.g, mid.b)}, ${rgbToHex(light.r, light.g, light.b)})`;
}

function buildHslPlaneBackground(h: number): string {
  const left = hslToRgb(createHsl(h, 0, 50));
  const right = hslToRgb(createHsl(h, 100, 50));
  return `
    linear-gradient(to top, #000, transparent 50%, #fff),
    linear-gradient(to right, ${rgbToHex(left.r, left.g, left.b)}, ${rgbToHex(right.r, right.g, right.b)})
  `;
}

function buildOklabHueGradient(): string {
  const stops = [0, 60, 120, 180, 240, 300, 360].map((h) => {
    const { r, g, b } = oklabToRgb(polarToOklab(createOklabPolar(h, 100, 0.5)));
    return `${rgbToHex(r, g, b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function buildOklabSaturationGradient(h: number, l: number): string {
  const low = oklabToRgb(polarToOklab(createOklabPolar(h, 0, l)));
  const high = oklabToRgb(polarToOklab(createOklabPolar(h, 100, l)));
  return `linear-gradient(to right, ${rgbToHex(low.r, low.g, low.b)}, ${rgbToHex(high.r, high.g, high.b)})`;
}

function buildOklabLightnessGradient(h: number, s: number): string {
  const dark = oklabToRgb(polarToOklab(createOklabPolar(h, s, 0)));
  const mid = oklabToRgb(polarToOklab(createOklabPolar(h, s, 0.5)));
  const light = oklabToRgb(polarToOklab(createOklabPolar(h, s, 1)));
  return `linear-gradient(to right, ${rgbToHex(dark.r, dark.g, dark.b)}, ${rgbToHex(mid.r, mid.g, mid.b)}, ${rgbToHex(light.r, light.g, light.b)})`;
}

const MODES: { id: ColorMode; label: string }[] = [
  { id: "hsl", label: "HSL" },
  { id: "oklab", label: "OKLab" },
];

function buildAlphaGradient(color: PixelColor): string {
  return `
    linear-gradient(to right, ${toHexAlpha(withAlpha(color, 0))}, ${toHexAlpha(withAlpha(color, 255))}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

function buildTransparentPreview(color: PixelColor): string {
  return `
    linear-gradient(${toHexAlpha(color)}, ${toHexAlpha(color)}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function ColorPickerPanel({ currentColor, onChange }: ColorPickerPanelProps) {
  const {
    mode,
    setMode,
    hsl,
    oklabPolar,
    alpha,
    hexInput,
    setHexInput,
    commitHexInput,
    setHue,
    setSaturation,
    setLightness,
    setAlpha,
    setHslPlane,
    beginOklabSliderDrag,
    endOklabSliderDrag,
    setOklabHue,
    setOklabSaturation,
    setOklabLightness,
    pickOklabPlaneColor,
    commitOklabPlanePick,
  } = useColorPickerState({ currentColor, onChange });

  return (
    <div className="flex w-60 flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <div
          className="h-10 w-10 shrink-0 rounded border border-zinc-600"
          style={{ background: buildTransparentPreview(currentColor) }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={commitHexInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitHexInput();
          }}
          className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-blue-500"
          spellCheck={false}
        />
      </div>

      <div className="flex rounded border border-zinc-700 bg-zinc-800 p-0.5">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
              mode === item.id
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "hsl" ? (
        <>
          <ColorSelectionPlane
            x={hsl.s}
            y={hsl.l}
            xMin={0}
            xMax={100}
            yMin={0}
            yMax={100}
            background={buildHslPlaneBackground(hsl.h)}
            onChange={setHslPlane}
          />
          <ColorChannelSlider
            label="H"
            value={hsl.h}
            min={0}
            max={360}
            displayValue={`${Math.round(hsl.h)}°`}
            gradient={buildHueGradient()}
            onChange={setHue}
          />
          <ColorChannelSlider
            label="S"
            value={hsl.s}
            min={0}
            max={100}
            displayValue={`${Math.round(hsl.s)}%`}
            gradient={buildHslSaturationGradient(hsl.h, hsl.l)}
            onChange={setSaturation}
          />
          <ColorChannelSlider
            label="L"
            value={hsl.l}
            min={0}
            max={100}
            displayValue={`${Math.round(hsl.l)}%`}
            gradient={buildHslLightnessGradient(hsl.h, hsl.s)}
            onChange={setLightness}
          />
        </>
      ) : (
        <>
          <OklabSelectionPlane
            hue={oklabPolar.h}
            markerS={oklabPolar.s}
            markerL={oklabPolar.l}
            onPickColor={pickOklabPlaneColor}
            onPickEnd={commitOklabPlanePick}
          />
          <ColorChannelSlider
            label="H"
            value={oklabPolar.h}
            min={0}
            max={360}
            displayValue={`${Math.round(oklabPolar.h)}°`}
            gradient={buildOklabHueGradient()}
            onDragStart={beginOklabSliderDrag}
            onDragEnd={endOklabSliderDrag}
            onChange={setOklabHue}
          />
          <ColorChannelSlider
            label="S"
            value={oklabPolar.s}
            min={0}
            max={100}
            displayValue={`${Math.round(oklabPolar.s)}%`}
            gradient={buildOklabSaturationGradient(oklabPolar.h, oklabPolar.l)}
            onDragStart={beginOklabSliderDrag}
            onDragEnd={endOklabSliderDrag}
            onChange={setOklabSaturation}
          />
          <ColorChannelSlider
            label="L"
            value={oklabPolar.l}
            min={0}
            max={1}
            step={0.001}
            displayValue={`${Math.round(oklabPolar.l * 100)}%`}
            gradient={buildOklabLightnessGradient(oklabPolar.h, oklabPolar.s)}
            onDragStart={beginOklabSliderDrag}
            onDragEnd={endOklabSliderDrag}
            onChange={setOklabLightness}
          />
        </>
      )}
      <ColorChannelSlider
        label="A"
        value={alpha}
        min={0}
        max={255}
        displayValue={`${Math.round((alpha / 255) * 100)}%`}
        gradient={buildAlphaGradient(currentColor)}
        onChange={setAlpha}
      />
    </div>
  );
}
