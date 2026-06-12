import { useCallback, useEffect, useRef, useState } from "react";
import { fromHex, toHex, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorMode } from "@/domain/color/ColorMode";
import {
  hslToPixelColor,
  oklabPolarToPixelColor,
  pixelColorToHsl,
  pixelColorToOklabPolar,
} from "@/domain/color/ColorConverter";
import { createHsl, type HslColor } from "@/domain/color/HslColor";
import { createOklabPolar, type OklabPolarColor } from "@/domain/color/OklabPolarColor";

interface UseColorPickerStateOptions {
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
}

export function useColorPickerState({ currentColor, onChange }: UseColorPickerStateOptions) {
  const [mode, setMode] = useState<ColorMode>("hsl");
  const [hsl, setHsl] = useState<HslColor>(() => pixelColorToHsl(currentColor));
  const [oklabPolar, setOklabPolar] = useState<OklabPolarColor>(() =>
    pixelColorToOklabPolar(currentColor),
  );
  const [hexInput, setHexInput] = useState(() => toHex(currentColor));
  const lastEmittedRef = useRef(currentColor);
  const oklabDragBaselineRef = useRef<OklabPolarColor | null>(null);
  const oklabPolarRef = useRef(oklabPolar);
  oklabPolarRef.current = oklabPolar;

  useEffect(() => {
    if (currentColor === lastEmittedRef.current) return;
    lastEmittedRef.current = currentColor;
    setHsl(pixelColorToHsl(currentColor));
    setOklabPolar(pixelColorToOklabPolar(currentColor));
    setHexInput(toHex(currentColor));
  }, [currentColor]);

  const emitColor = useCallback(
    (color: PixelColor) => {
      lastEmittedRef.current = color;
      onChange(color);
      setHexInput(toHex(color));
      setHsl(pixelColorToHsl(color));
      setOklabPolar(pixelColorToOklabPolar(color));
    },
    [onChange],
  );

  const emitOklabFromPolar = useCallback(
    (polar: OklabPolarColor) => {
      const color = oklabPolarToPixelColor(polar);
      lastEmittedRef.current = color;
      onChange(color);
      setHexInput(toHex(color));
      setOklabPolar(polar);
      setHsl(pixelColorToHsl(color));
    },
    [onChange],
  );

  const emitPlaneColor = useCallback(
    (color: PixelColor) => {
      lastEmittedRef.current = color;
      onChange(color);
      setHexInput(toHex(color));
      setHsl(pixelColorToHsl(color));
    },
    [onChange],
  );

  const updateFromHsl = useCallback(
    (next: HslColor) => {
      setHsl(next);
      emitColor(hslToPixelColor(next));
    },
    [emitColor],
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

  const beginOklabSliderDrag = useCallback(() => {
    oklabDragBaselineRef.current = { ...oklabPolarRef.current };
  }, []);

  const endOklabSliderDrag = useCallback(() => {
    oklabDragBaselineRef.current = null;
  }, []);

  const getOklabBaseline = useCallback((): OklabPolarColor => {
    return oklabDragBaselineRef.current ?? oklabPolar;
  }, [oklabPolar]);

  const setOklabHue = useCallback(
    (h: number) => {
      const baseline = getOklabBaseline();
      emitOklabFromPolar(createOklabPolar(h, baseline.s, baseline.l));
    },
    [emitOklabFromPolar, getOklabBaseline],
  );

  const setOklabSaturation = useCallback(
    (s: number) => {
      const baseline = getOklabBaseline();
      emitOklabFromPolar(createOklabPolar(baseline.h, s, baseline.l));
    },
    [emitOklabFromPolar, getOklabBaseline],
  );

  const setOklabLightness = useCallback(
    (l: number) => {
      const baseline = getOklabBaseline();
      emitOklabFromPolar(createOklabPolar(baseline.h, baseline.s, l));
    },
    [emitOklabFromPolar, getOklabBaseline],
  );

  const pickOklabPlaneColor = useCallback(
    (color: PixelColor) => {
      emitPlaneColor(color);
    },
    [emitPlaneColor],
  );

  const commitOklabPlanePick = useCallback(
    (color: PixelColor) => {
      lastEmittedRef.current = color;
      setOklabPolar(pixelColorToOklabPolar(color));
    },
    [],
  );

  const commitHexInput = useCallback(() => {
    const normalized = hexInput.trim();
    if (!/^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(normalized)) {
      setHexInput(toHex(currentColor));
      return;
    }
    const color = fromHex(normalized.startsWith("#") ? normalized : `#${normalized}`);
    emitColor(color);
  }, [currentColor, emitColor, hexInput]);

  return {
    mode,
    setMode,
    hsl,
    oklabPolar,
    hexInput,
    setHexInput,
    commitHexInput,
    setHue,
    setSaturation,
    setLightness,
    setHslPlane,
    beginOklabSliderDrag,
    endOklabSliderDrag,
    setOklabHue,
    setOklabSaturation,
    setOklabLightness,
    pickOklabPlaneColor,
    commitOklabPlanePick,
  };
}
