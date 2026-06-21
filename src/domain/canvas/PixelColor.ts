export type PixelColor = number;

export const TRANSPARENT: PixelColor = 0;

function toHexByte(value: number): string {
  return (value & 0xff).toString(16).padStart(2, "0");
}

export function rgba(r: number, g: number, b: number, a = 255): PixelColor {
  return (
    ((a & 0xff) << 24) |
    ((b & 0xff) << 16) |
    ((g & 0xff) << 8) |
    (r & 0xff)
  ) >>> 0;
}

export function fromHex(hex: string): PixelColor {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 || normalized.length === 4
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (value.length !== 6 && value.length !== 8) {
    return TRANSPARENT;
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) : 255;
  return rgba(r, g, b, a);
}

export function toHex(color: PixelColor): string {
  const r = color & 0xff;
  const g = (color >> 8) & 0xff;
  const b = (color >> 16) & 0xff;
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

export function toHexAlpha(color: PixelColor): string {
  return `${toHex(color)}${toHexByte(getAlpha(color))}`;
}

export function getAlpha(color: PixelColor): number {
  return (color >>> 24) & 0xff;
}

export function withAlpha(color: PixelColor, alpha: number): PixelColor {
  const { r, g, b } = toRgbComponents(color);
  return rgba(r, g, b, alpha);
}

export function colorsEqual(a: PixelColor, b: PixelColor): boolean {
  return a === b;
}

export function isTransparent(color: PixelColor): boolean {
  return getAlpha(color) === 0;
}

export function colorDistance(a: PixelColor, b: PixelColor): number {
  const ca = toRgbaComponents(a);
  const cb = toRgbaComponents(b);
  return (
    Math.abs(ca.r - cb.r) +
    Math.abs(ca.g - cb.g) +
    Math.abs(ca.b - cb.b) +
    Math.abs(ca.a - cb.a)
  );
}

export function rgbKey(color: PixelColor): string {
  const r = color & 0xff;
  const g = (color >> 8) & 0xff;
  const b = (color >> 16) & 0xff;
  return `${r},${g},${b}`;
}

export function toRgbComponents(color: PixelColor): { r: number; g: number; b: number } {
  return {
    r: color & 0xff,
    g: (color >> 8) & 0xff,
    b: (color >> 16) & 0xff,
  };
}

export function toRgbaComponents(color: PixelColor): { r: number; g: number; b: number; a: number } {
  return {
    ...toRgbComponents(color),
    a: getAlpha(color),
  };
}
