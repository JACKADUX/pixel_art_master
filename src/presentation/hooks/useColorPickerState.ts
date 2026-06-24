import { useCallback, useEffect, useRef, useState } from "react";
import {
  fromHex,
  getAlpha,
  toHexAlpha,
  withAlpha,
  type PixelColor,
} from "@/domain/canvas/PixelColor";
import {
  hslToPixelColor,
  oklchToPixelColor,
  pixelColorToHsl,
  pixelColorToHslPreservingHue,
  pixelColorToOklch,
  pixelColorToOklchPreservingHue,
} from "@/domain/color/ColorConverter";
import { createHsl, type HslColor } from "@/domain/color/HslColor";
import { createOklch, type OklchColor } from "@/domain/color/OklchColor";

interface UseColorPickerStateOptions {
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
}

export function useColorPickerState({ currentColor, onChange }: UseColorPickerStateOptions) {
  const [hsl, setHsl] = useState<HslColor>(() => pixelColorToHsl(currentColor));
  const [oklch, setOklch] = useState<OklchColor>(() => pixelColorToOklch(currentColor));
  const [alpha, setAlphaState] = useState(() => getAlpha(currentColor));
  const [hexInput, setHexInput] = useState(() => toHexAlpha(currentColor));
  const lastEmittedRef = useRef(currentColor);
  const oklchDragBaselineRef = useRef<OklchColor | null>(null);
  const oklchRef = useRef(oklch);
  oklchRef.current = oklch;

  useEffect(() => {
    if (currentColor === lastEmittedRef.current) return;
    lastEmittedRef.current = currentColor;
    setHsl(pixelColorToHsl(currentColor));
    setOklch(pixelColorToOklch(currentColor));
    setAlphaState(getAlpha(currentColor));
    setHexInput(toHexAlpha(currentColor));
  }, [currentColor]);

  const emitColor = useCallback(
    (color: PixelColor) => {
      lastEmittedRef.current = color;
      onChange(color);
      setAlphaState(getAlpha(color));
      setHexInput(toHexAlpha(color));
      setHsl((prev) => pixelColorToHslPreservingHue(color, prev));
      setOklch((prev) => pixelColorToOklchPreservingHue(color, prev));
    },
    [onChange],
  );

  const emitHsl = useCallback(
    (next: HslColor) => {
      const color = hslToPixelColor(next, alpha);
      lastEmittedRef.current = color;
      onChange(color);
      setHexInput(toHexAlpha(color));
      setHsl(next);
      setOklch((prev) => pixelColorToOklchPreservingHue(color, prev));
    },
    [alpha, onChange],
  );

  const emitOklch = useCallback(
    (next: OklchColor) => {
      const color = oklchToPixelColor(next, alpha);
      lastEmittedRef.current = color;
      onChange(color);
      setHexInput(toHexAlpha(color));
      setOklch(next);
      setHsl((prev) => pixelColorToHslPreservingHue(color, prev));
    },
    [alpha, onChange],
  );

  const emitPlaneColor = useCallback(
    (color: PixelColor) => {
      const colorWithAlpha = withAlpha(color, alpha);
      lastEmittedRef.current = colorWithAlpha;
      onChange(colorWithAlpha);
      setHexInput(toHexAlpha(colorWithAlpha));
      setHsl((prev) => pixelColorToHslPreservingHue(colorWithAlpha, prev));
    },
    [alpha, onChange],
  );

  const updateFromHsl = useCallback(
    (next: HslColor) => {
      emitHsl(next);
    },
    [emitHsl],
  );

  const setHue = useCallback(
    (h: number) => updateFromHsl(createHsl(h, hsl.s, hsl.l)),
    [hsl.s, hsl.l, updateFromHsl],
  );

  const setSaturation = useCallback(
    (s: number) => updateFromHsl(createHsl(hsl.h, s, hsl.l)),
    [hsl.h, hsl.l, updateFromHsl],
  );

  const setLightness = useCallback(
    (l: number) => updateFromHsl(createHsl(hsl.h, hsl.s, l)),
    [hsl.h, hsl.s, updateFromHsl],
  );

  const setHslPlane = useCallback(
    (s: number, l: number) => updateFromHsl(createHsl(hsl.h, s, l)),
    [hsl.h, updateFromHsl],
  );

  const beginOklchSliderDrag = useCallback(() => {
    oklchDragBaselineRef.current = { ...oklchRef.current };
  }, []);

  const endOklchSliderDrag = useCallback(() => {
    oklchDragBaselineRef.current = null;
  }, []);

  const getOklchBaseline = useCallback((): OklchColor => {
    return oklchDragBaselineRef.current ?? oklch;
  }, [oklch]);

  const setOklchHue = useCallback(
    (h: number) => {
      const baseline = getOklchBaseline();
      emitOklch(createOklch(baseline.l, baseline.c, h));
    },
    [emitOklch, getOklchBaseline],
  );

  const setOklchChroma = useCallback(
    (c: number) => {
      const baseline = getOklchBaseline();
      emitOklch(createOklch(baseline.l, c, baseline.h));
    },
    [emitOklch, getOklchBaseline],
  );

  const setOklchLightness = useCallback(
    (l: number) => {
      const baseline = getOklchBaseline();
      emitOklch(createOklch(l, baseline.c, baseline.h));
    },
    [emitOklch, getOklchBaseline],
  );

  const pickOklchPlaneColor = useCallback(
    (color: PixelColor) => {
      emitPlaneColor(color);
    },
    [emitPlaneColor],
  );

  const commitOklchPlanePick = useCallback(
    (color: PixelColor) => {
      lastEmittedRef.current = withAlpha(color, alpha);
      setOklch((prev) => pixelColorToOklchPreservingHue(color, prev));
    },
    [alpha],
  );

  const setAlpha = useCallback(
    (nextAlpha: number) => {
      const color = withAlpha(currentColor, nextAlpha);
      emitColor(color);
    },
    [currentColor, emitColor],
  );

  const commitHexInput = useCallback(() => {
    const normalized = hexInput.trim();
    if (!/^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
      setHexInput(toHexAlpha(currentColor));
      return;
    }
    const color = fromHex(normalized.startsWith("#") ? normalized : `#${normalized}`);
    emitColor(color);
  }, [currentColor, emitColor, hexInput]);

  return {
    hsl,
    oklch,
    alpha,
    hexInput,
    setHexInput,
    commitHexInput,
    setHue,
    setSaturation,
    setLightness,
    setAlpha,
    setHslPlane,
    beginOklchSliderDrag,
    endOklchSliderDrag,
    setOklchHue,
    setOklchChroma,
    setOklchLightness,
    pickOklchPlaneColor,
    commitOklchPlanePick,
  };
}

export type ColorPickerState = ReturnType<typeof useColorPickerState>;
