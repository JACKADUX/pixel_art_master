export type PixelColor = number;

export const TRANSPARENT: PixelColor = 0;

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
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return rgba(r, g, b);
}

export function toHex(color: PixelColor): string {
  const r = color & 0xff;
  const g = (color >> 8) & 0xff;
  const b = (color >> 16) & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function getAlpha(color: PixelColor): number {
  return (color >>> 24) & 0xff;
}

export function colorsEqual(a: PixelColor, b: PixelColor): boolean {
  return a === b;
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
