import { describe, expect, it } from "vitest";
import { deriveHexPresetName, parseHexPaletteContent } from "./HexPaletteFile";

describe("parseHexPaletteContent", () => {
  it("解析标准 .hex 文件（每行一个无前缀颜色）", () => {
    const content = "1a1c2c\n5d275d\nb13e53";
    const entries = parseHexPaletteContent(content);
    expect(entries.map((e) => e.hex)).toEqual(["#1a1c2cff", "#5d275dff", "#b13e53ff"]);
  });

  it("兼容 # 前缀、3 位写法与 CRLF 换行", () => {
    const content = "#fff\r\n#000000\r\n";
    const entries = parseHexPaletteContent(content);
    expect(entries.map((e) => e.hex)).toEqual(["#ffffffff", "#000000ff"]);
  });

  it("支持 8 位带 alpha 的颜色", () => {
    const entries = parseHexPaletteContent("00ff0080");
    expect(entries.map((e) => e.hex)).toEqual(["#00ff0080"]);
  });

  it("跳过空行、注释行与非法行", () => {
    const content = "; 注释\n// 另一种注释\n\nzzzzzz\n12\nff0000";
    const entries = parseHexPaletteContent(content);
    expect(entries.map((e) => e.hex)).toEqual(["#ff0000ff"]);
  });

  it("按出现顺序去重", () => {
    const content = "ff0000\nFF0000\nff0000\n00ff00";
    const entries = parseHexPaletteContent(content);
    expect(entries.map((e) => e.hex)).toEqual(["#ff0000ff", "#00ff00ff"]);
  });

  it("空内容返回空数组", () => {
    expect(parseHexPaletteContent("")).toEqual([]);
  });
});

describe("deriveHexPresetName", () => {
  it("去除目录与扩展名", () => {
    expect(deriveHexPresetName("C:\\colors\\sweetie-16.hex")).toBe("sweetie-16");
    expect(deriveHexPresetName("/home/user/nord.hex")).toBe("nord");
  });

  it("无有效名称时回退到默认名", () => {
    expect(deriveHexPresetName(".hex")).toBe("导入色板");
  });
});
