import type { CSSProperties } from "react";
import { toHexAlpha, withAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorMode } from "@/domain/color/ColorMode";
import {
  COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT,
  COLOR_PICKER_HORIZONTAL_LEFT_WIDTH,
  COLOR_PICKER_HORIZONTAL_SLIDER_GAP,
  COLOR_PICKER_HORIZONTAL_SLIDER_WIDTH,
  COLOR_PICKER_HORIZONTAL_WIDTH,
  COLOR_PICKER_PREVIEW_SIZE,
  COLOR_PICKER_VERTICAL_WIDTH,
  getColorPickerPlaneAspectRatio,
  type ColorPickerLayoutOrientation,
} from "@/domain/color/ColorPickerLayout";
import { hslToRgb, oklabToRgb, rgbToHex } from "@/domain/color/ColorConverter";
import { createHsl } from "@/domain/color/HslColor";
import { createOklabPolar, polarToOklab } from "@/domain/color/OklabPolarColor";
import { useColorPickerState } from "@/presentation/hooks/useColorPickerState";
import {
  ColorChannelSlider,
  parseAlphaPercentInput,
  parseHueInput,
  parseOklabLightnessInput,
  parsePercentInput,
} from "./ColorChannelSlider";
import { ColorSelectionPlane } from "./ColorSelectionPlane";
import { OklabSelectionPlane } from "./OklabSelectionPlane";

interface ColorPickerPanelProps {
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
  orientation: ColorPickerLayoutOrientation;
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

const PLANE_CLASS =
  "relative w-full shrink-0 cursor-crosshair overflow-hidden rounded border border-zinc-700 touch-none";

function planeStyle(orientation: ColorPickerLayoutOrientation): CSSProperties {
  return { aspectRatio: getColorPickerPlaneAspectRatio(orientation) };
}

function ColorPreviewSwatch({ color }: { color: PixelColor }) {
  return (
    <div
      className="shrink-0 rounded border border-zinc-600"
      style={{
        width: COLOR_PICKER_PREVIEW_SIZE,
        height: COLOR_PICKER_PREVIEW_SIZE,
        background: buildTransparentPreview(color),
      }}
    />
  );
}

export function ColorPickerPanel({
  currentColor,
  onChange,
  orientation,
}: ColorPickerPanelProps) {
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

  const isHorizontal = orientation === "horizontal";

  const alphaSlider = (
    <ColorChannelSlider
      label="A"
      value={alpha}
      min={0}
      max={255}
      displayValue={`${Math.round((alpha / 255) * 100)}%`}
      gradient={buildAlphaGradient(currentColor)}
      onChange={setAlpha}
      parseInput={parseAlphaPercentInput}
    />
  );

  const hslSliders = (
    <>
      <ColorChannelSlider
        label="H"
        value={hsl.h}
        min={0}
        max={360}
        displayValue={`${Math.round(hsl.h)}°`}
        gradient={buildHueGradient()}
        onChange={setHue}
        parseInput={parseHueInput}
      />
      <ColorChannelSlider
        label="S"
        value={hsl.s}
        min={0}
        max={100}
        displayValue={`${Math.round(hsl.s)}%`}
        gradient={buildHslSaturationGradient(hsl.h, hsl.l)}
        onChange={setSaturation}
        parseInput={parsePercentInput}
      />
      <ColorChannelSlider
        label="L"
        value={hsl.l}
        min={0}
        max={100}
        displayValue={`${Math.round(hsl.l)}%`}
        gradient={buildHslLightnessGradient(hsl.h, hsl.s)}
        onChange={setLightness}
        parseInput={parsePercentInput}
      />
    </>
  );

  const oklabSliders = (
    <>
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
        parseInput={parseHueInput}
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
        parseInput={parsePercentInput}
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
        parseInput={parseOklabLightnessInput}
      />
    </>
  );

  const selectionPlane =
    mode === "hsl" ? (
      <ColorSelectionPlane
        x={hsl.s}
        y={hsl.l}
        xMin={0}
        xMax={100}
        yMin={0}
        yMax={100}
        background={buildHslPlaneBackground(hsl.h)}
        onChange={setHslPlane}
        className={isHorizontal ? `${PLANE_CLASS} h-full` : PLANE_CLASS}
        style={isHorizontal ? { width: "100%", height: "100%" } : planeStyle(orientation)}
      />
    ) : (
      <OklabSelectionPlane
        hue={oklabPolar.h}
        markerS={oklabPolar.s}
        markerL={oklabPolar.l}
        onPickColor={pickOklabPlaneColor}
        onPickEnd={commitOklabPlanePick}
        className={isHorizontal ? `${PLANE_CLASS} h-full` : PLANE_CLASS}
        style={isHorizontal ? { width: "100%", height: "100%" } : planeStyle(orientation)}
      />
    );

  const modeToggle = (
    <div
      className={`flex rounded border border-zinc-700 bg-zinc-800 p-0.5 ${
        isHorizontal ? "flex-col gap-0.5" : ""
      }`}
    >
      {MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setMode(item.id)}
          className={`rounded font-medium transition ${
            isHorizontal ? "px-1.5 py-0.5 text-[10px]" : "flex-1 px-2 py-1 text-xs"
          } ${
            mode === item.id
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  if (isHorizontal) {
    const blockHeight = COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT;

    return (
      <div
        className="flex flex-row items-start gap-3 p-3"
        style={{ width: COLOR_PICKER_HORIZONTAL_WIDTH }}
      >
        <div
          className="flex shrink-0 flex-col justify-between"
          style={{ width: COLOR_PICKER_HORIZONTAL_LEFT_WIDTH, height: blockHeight }}
        >
          <ColorPreviewSwatch color={currentColor} />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={commitHexInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitHexInput();
            }}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-1 py-1 font-mono text-[10px] leading-none text-zinc-200 outline-none focus:border-blue-500"
            spellCheck={false}
          />
          {modeToggle}
        </div>

        <div
          className="shrink-0"
          style={{ width: blockHeight, height: blockHeight }}
        >
          {selectionPlane}
        </div>

        <div
          className="flex shrink-0 flex-col"
          style={{
            width: COLOR_PICKER_HORIZONTAL_SLIDER_WIDTH,
            height: blockHeight,
            gap: COLOR_PICKER_HORIZONTAL_SLIDER_GAP,
          }}
        >
          {mode === "hsl" ? hslSliders : oklabSliders}
          {alphaSlider}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 p-3"
      style={{ width: COLOR_PICKER_VERTICAL_WIDTH }}
    >
      <div className="flex items-center gap-2">
        <ColorPreviewSwatch color={currentColor} />
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

      {modeToggle}
      {selectionPlane}
      <div className="flex flex-col gap-2">
        {mode === "hsl" ? hslSliders : oklabSliders}
        {alphaSlider}
      </div>
    </div>
  );
}
