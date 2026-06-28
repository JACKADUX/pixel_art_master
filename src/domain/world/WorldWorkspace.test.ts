import { describe, expect, it } from "vitest";
import {
  buildWorldFileName,
  buildWorldFilePath,
  isWorldFileName,
  sanitizeWorldFileName,
} from "./WorldWorkspace";

describe("WorldWorkspace", () => {
  it("sanitizes illegal file name characters", () => {
    expect(sanitizeWorldFileName('a/b:c*?')).toBe("a_b_c__");
    expect(sanitizeWorldFileName("   ")).toBe("未命名世界");
  });

  it("builds file names with suffix", () => {
    expect(buildWorldFileName("世界")).toBe("世界.world.json");
    expect(buildWorldFileName("世界", 2)).toBe("世界 (2).world.json");
  });

  it("builds file path using the workspace separator", () => {
    expect(buildWorldFilePath("C:\\worlds", "世界")).toBe("C:\\worlds\\世界.world.json");
    expect(buildWorldFilePath("/home/worlds/", "世界")).toBe("/home/worlds/世界.world.json");
  });

  it("detects world file names", () => {
    expect(isWorldFileName("a.world.json")).toBe(true);
    expect(isWorldFileName("a.pixelart.json")).toBe(false);
  });
});
