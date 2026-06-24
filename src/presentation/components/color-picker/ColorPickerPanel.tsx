import type { CSSProperties } from "react";
import { toHexAlpha, withAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import {
  COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT,
  COLOR_PICKER_HORIZONTAL_SLIDER_GAP,
  COLOR_PICKER_HORIZONTAL_SLIDER_WIDTH,
  COLOR_PICKER_HORIZONTAL_WIDTH,
  COLOR_PICKER_VERTICAL_WIDTH,
  getColorPickerPlaneAspectRatio,
  type ColorPickerLayoutOrientation,
} from "@/domain/color/ColorPickerLayout";
import { oklabToRgb, rgbToHex } from "@/domain/color/ColorConverter";
import { OKLCH_MAX_CHROMA, createOklch, oklchToOklab } from "@/domain/color/OklchColor";
import type { ColorPickerState } from "@/presentation/hooks/useColorPickerState";
import {
  ColorChannelSlider,
  parseChromaInput,
  parseAlphaPercentInput,
  parseHueInput,
  parseUnitLightnessInput,
} from "./ColorChannelSlider";
import { OklchSelectionPlane } from "./OklchSelectionPlane";

interface ColorPickerPanelProps {
  currentColor: PixelColor;
  orientation: ColorPickerLayoutOrientation;
  state: ColorPickerState;
}

function buildOklchHueGradient(): string {
  const stops = [0, 60, 120, 180, 240, 300, 360].map((h) => {
    const { r, g, b } = oklabToRgb(oklchToOklab(createOklch(0.5, OKLCH_MAX_CHROMA, h)));
    return `${rgbToHex(r, g, b)} ${(h / 360) * 100}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function buildOklchChromaGradient(h: number, l: number): string {
  const low = oklabToRgb(oklchToOklab(createOklch(l, 0, h)));
  const high = oklabToRgb(oklchToOklab(createOklch(l, OKLCH_MAX_CHROMA, h)));
  return `linear-gradient(to right, ${rgbToHex(low.r, low.g, low.b)}, ${rgbToHex(high.r, high.g, high.b)})`;
}

function buildOklchLightnessGradient(h: number, c: number): string {
  const dark = oklabToRgb(oklchToOklab(createOklch(0, c, h)));
  const mid = oklabToRgb(oklchToOklab(createOklch(0.5, c, h)));
  const light = oklabToRgb(oklchToOklab(createOklch(1, c, h)));
  return `linear-gradient(to right, ${rgbToHex(dark.r, dark.g, dark.b)}, ${rgbToHex(mid.r, mid.g, mid.b)}, ${rgbToHex(light.r, light.g, light.b)})`;
}

function buildAlphaGradient(color: PixelColor): string {
  return `
    linear-gradient(to right, ${toHexAlpha(withAlpha(color, 0))}, ${toHexAlpha(withAlpha(color, 255))}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

const PLANE_CLASS =
  "relative w-full shrink-0 cursor-crosshair overflow-hidden rounded border border-zinc-700 touch-none";

function planeStyle(orientation: ColorPickerLayoutOrientation): CSSProperties {
  return { aspectRatio: getColorPickerPlaneAspectRatio(orientation) };
}

export function ColorPickerPanel({
  currentColor,
  orientation,
  state,
}: ColorPickerPanelProps) {
  const {
    oklch,
    alpha,
    setAlpha,
    beginOklchSliderDrag,
    endOklchSliderDrag,
    setOklchHue,
    setOklchChroma,
    setOklchLightness,
    pickOklchPlaneColor,
    commitOklchPlanePick,
  } = state;

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

  const oklchSliders = (
    <>
      <ColorChannelSlider
        label="H"
        value={oklch.h}
        min={0}
        max={360}
        displayValue={`${Math.round(oklch.h)}°`}
        gradient={buildOklchHueGradient()}
        onDragStart={beginOklchSliderDrag}
        onDragEnd={endOklchSliderDrag}
        onChange={setOklchHue}
        parseInput={parseHueInput}
      />
      <ColorChannelSlider
        label="C"
        value={oklch.c}
        min={0}
        max={OKLCH_MAX_CHROMA}
        step={0.001}
        displayValue={`${Math.round((oklch.c / OKLCH_MAX_CHROMA) * 100)}%`}
        gradient={buildOklchChromaGradient(oklch.h, oklch.l)}
        onDragStart={beginOklchSliderDrag}
        onDragEnd={endOklchSliderDrag}
        onChange={setOklchChroma}
        parseInput={parseChromaInput}
      />
      <ColorChannelSlider
        label="L"
        value={oklch.l}
        min={0}
        max={1}
        step={0.001}
        displayValue={`${Math.round(oklch.l * 100)}%`}
        gradient={buildOklchLightnessGradient(oklch.h, oklch.c)}
        onDragStart={beginOklchSliderDrag}
        onDragEnd={endOklchSliderDrag}
        onChange={setOklchLightness}
        parseInput={parseUnitLightnessInput}
      />
    </>
  );

  const selectionPlane = (
    <OklchSelectionPlane
      hue={oklch.h}
      markerC={oklch.c}
      markerL={oklch.l}
      onPickColor={pickOklchPlaneColor}
      onPickEnd={commitOklchPlanePick}
      className={isHorizontal ? `${PLANE_CLASS} h-full` : PLANE_CLASS}
      style={isHorizontal ? { width: "100%", height: "100%" } : planeStyle(orientation)}
    />
  );

  if (isHorizontal) {
    const blockHeight = COLOR_PICKER_HORIZONTAL_BLOCK_HEIGHT;

    return (
      <div
        className="flex flex-row items-start gap-3 p-3"
        style={{ width: COLOR_PICKER_HORIZONTAL_WIDTH }}
      >
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
          {oklchSliders}
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
      {selectionPlane}
      <div className="flex flex-col gap-2">
        {oklchSliders}
        {alphaSlider}
      </div>
    </div>
  );
}
