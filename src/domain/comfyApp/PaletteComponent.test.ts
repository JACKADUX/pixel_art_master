import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import type { ColorEntry } from "../palette/Palette";
import {
  colorEntriesToPaletteItems,
  imageDataToPaletteItems,
  normalizeHexLine,
  paletteItemsToValueString,
  parseHexText,
  pixelColorToHexValue,
} from "./PaletteComponent";

function makeImageData(colors: Array<[number, number, number]>): ImageData {
  const data = new Uint8ClampedArray(colors.length * 4);
  colors.forEach(([r, g, b], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  });
  return { width: colors.length, height: 1, data } as ImageData;
}

describe("normalizeHexLine", () => {
  it("规范化为大写 RRGGBB，去掉 # 与 alpha", () => {
    expect(normalizeHexLine("#aabbcc")).toBe("AABBCC");
    expect(normalizeHexLine("aabbccff")).toBe("AABBCC");
    expect(normalizeHexLine("  #abc  ")).toBe("AABBCC");
  });

  it("非法输入返回 null", () => {
    expect(normalizeHexLine("")).toBeNull();
    expect(normalizeHexLine("xyz")).toBeNull();
    expect(normalizeHexLine("#12")).toBeNull();
  });
});

describe("parseHexText", () => {
  it("按行解析，保留重复与顺序，跳过空行/非法行", () => {
    const text = "FF0000\n#00FF00\n\nnope\nff0000\n";
    const items = parseHexText(text);
    expect(items.map((i) => i.hex)).toEqual(["FF0000", "00FF00", "FF0000"]);
    expect(items.every((i) => i.disabled === false)).toBe(true);
  });
});

describe("paletteItemsToValueString", () => {
  it("过滤禁用项并以换行连接", () => {
    const result = paletteItemsToValueString([
      { hex: "FF0000", disabled: false },
      { hex: "00FF00", disabled: true },
      { hex: "0000FF", disabled: false },
    ]);
    expect(result).toBe("FF0000\n0000FF");
  });
});

describe("imageDataToPaletteItems", () => {
  it("取前 N 个像素并保留重复色", () => {
    const image = makeImageData([
      [255, 0, 0],
      [255, 0, 0],
      [0, 0, 255],
    ]);
    const items = imageDataToPaletteItems(image, 256);
    expect(items.map((i) => i.hex)).toEqual(["FF0000", "FF0000", "0000FF"]);
  });

  it("遵守 max 上限", () => {
    const image = makeImageData([
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ]);
    expect(imageDataToPaletteItems(image, 2)).toHaveLength(2);
  });
});

describe("colorEntriesToPaletteItems", () => {
  it("从色板预设条目转换为大写 RRGGBB", () => {
    const entries: ColorEntry[] = [
      { color: rgba(255, 0, 0, 255), hex: "#ff0000ff" },
      { color: rgba(0, 0, 255, 128), hex: "#0000ff80" },
    ];
    expect(colorEntriesToPaletteItems(entries).map((i) => i.hex)).toEqual([
      "FF0000",
      "0000FF",
    ]);
  });
});

describe("pixelColorToHexValue", () => {
  it("输出大写 RRGGBB", () => {
    expect(pixelColorToHexValue(rgba(171, 205, 239, 255))).toBe("ABCDEF");
  });
});
