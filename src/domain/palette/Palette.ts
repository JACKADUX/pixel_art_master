import type { PixelColor } from "../canvas/PixelColor";
import { fromHex, rgbKey, toHex } from "../canvas/PixelColor";

export interface ColorEntry {
  color: PixelColor;
  hex: string;
}

export class Palette {
  private colors: ColorEntry[];

  constructor(colors: ColorEntry[] = []) {
    this.colors = [...colors];
  }

  static empty(): Palette {
    return new Palette();
  }

  getColors(): readonly ColorEntry[] {
    return this.colors;
  }

  addColor(color: PixelColor): void {
    const hex = toHex(color);
    if (!this.colors.some((c) => c.hex === hex)) {
      this.colors.push({ color, hex });
    }
  }

  addFromHex(hex: string): void {
    this.addColor(fromHex(hex));
  }

  removeColor(hex: string): void {
    this.colors = this.colors.filter((c) => c.hex !== hex);
  }

  setColors(colors: ColorEntry[]): void {
    this.colors = [...colors];
  }

  toJSON(): ColorEntry[] {
    return this.colors.map((c) => ({ color: c.color, hex: c.hex }));
  }

  static fromJSON(data: ColorEntry[]): Palette {
    return new Palette(data);
  }

  static fromUniqueColors(colors: PixelColor[]): Palette {
    const seen = new Set<string>();
    const entries: ColorEntry[] = [];
    for (const color of colors) {
      const key = rgbKey(color);
      if (!seen.has(key)) {
        seen.add(key);
        entries.push({ color, hex: toHex(color) });
      }
    }
    entries.sort((a, b) => a.hex.localeCompare(b.hex));
    return new Palette(entries);
  }
}
