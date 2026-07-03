import { fromHex, toHexAlpha } from "../canvas/PixelColor";
import type { ColorEntry } from "./Palette";

const VALID_HEX_LENGTHS = new Set([3, 4, 6, 8]);
const HEX_CHARS_PATTERN = /^[0-9a-fA-F]+$/;

function normalizeHexToken(rawLine: string): string | null {
  let token = rawLine.trim();
  if (token.length === 0) return null;
  if (token.startsWith(";") || token.startsWith("//")) return null;
  token = token.replace(/^#/, "");
  if (!VALID_HEX_LENGTHS.has(token.length)) return null;
  if (!HEX_CHARS_PATTERN.test(token)) return null;
  return token;
}

/**
 * 解析 .hex 色板文件内容（每行一个十六进制颜色，兼容可选的 `#` 前缀、
 * 3/4/6/8 位写法，自动跳过空行与注释行，并按出现顺序去重）。
 */
export function parseHexPaletteContent(content: string): ColorEntry[] {
  const entries: ColorEntry[] = [];
  const seen = new Set<string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const token = normalizeHexToken(rawLine);
    if (!token) continue;
    const color = fromHex(token);
    const hex = toHexAlpha(color);
    if (seen.has(hex)) continue;
    seen.add(hex);
    entries.push({ color, hex });
  }

  return entries;
}

/** 从文件路径推导预设名称（去掉目录与扩展名）。 */
export function deriveHexPresetName(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? "";
  const withoutExt = base.replace(/\.[^.]+$/, "").trim();
  return withoutExt.length > 0 ? withoutExt : "导入色板";
}
