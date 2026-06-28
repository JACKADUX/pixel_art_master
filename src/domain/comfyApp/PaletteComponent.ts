import { fromHex, toHex, type PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";

/**
 * 色板组件的单个颜色项。
 * - hex      : 规范化后的大写 RRGGBB（不含 #）
 * - disabled : 禁用项仍在界面展示，但不计入最终输出结果
 */
export interface PaletteColorItem {
  hex: string;
  disabled: boolean;
}

/** 默认取色上限（图片取前 N 个像素） */
export const PALETTE_IMAGE_MAX_COLORS = 256;

/** 新增颜色时的默认值（黑色） */
export const DEFAULT_PALETTE_HEX = "000000";

/** PixelColor -> 大写 RRGGBB（去 #，丢弃 alpha） */
export function pixelColorToHexValue(color: PixelColor): string {
  return toHex(color).slice(1).toUpperCase();
}

/**
 * 规范化单行 hex 文本为大写 RRGGBB。
 * 支持带/不带 #、3/4/6/8 位；统一取 RGB 三通道，非法返回 null。
 */
export function normalizeHexLine(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null;
  if (![3, 4, 6, 8].includes(trimmed.length)) return null;
  return pixelColorToHexValue(fromHex(trimmed));
}

/**
 * 解析 .hex 文本（每行一个 hex），保留重复色与原始顺序，跳过空行/非法行。
 */
export function parseHexText(text: string): PaletteColorItem[] {
  const items: PaletteColorItem[] = [];
  for (const line of text.split(/\r?\n/)) {
    const hex = normalizeHexLine(line);
    if (hex) items.push({ hex, disabled: false });
  }
  return items;
}

/**
 * 从图片像素生成色板：按行优先顺序取前 max 个像素颜色，保留重复色。
 */
export function imageDataToPaletteItems(
  data: ImageData,
  max = PALETTE_IMAGE_MAX_COLORS,
): PaletteColorItem[] {
  const items: PaletteColorItem[] = [];
  const totalPixels = data.width * data.height;
  const count = Math.min(max, totalPixels);
  const bytes = data.data;
  for (let i = 0; i < count; i += 1) {
    const offset = i * 4;
    const r = bytes[offset];
    const g = bytes[offset + 1];
    const b = bytes[offset + 2];
    const hex = `${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`.toUpperCase();
    items.push({ hex, disabled: false });
  }
  return items;
}

/** 色板预设的 ColorEntry[] -> 色板组件取值项 */
export function colorEntriesToPaletteItems(
  entries: readonly ColorEntry[],
): PaletteColorItem[] {
  return entries.map((entry) => ({
    hex: pixelColorToHexValue(entry.color),
    disabled: false,
  }));
}

/** 取值项 -> 输出字符串：过滤禁用项，每行一个大写 RRGGBB */
export function paletteItemsToValueString(
  items: readonly PaletteColorItem[],
): string {
  return items
    .filter((item) => !item.disabled)
    .map((item) => item.hex)
    .join("\n");
}

function toHexByte(value: number): string {
  return (value & 0xff).toString(16).padStart(2, "0");
}
