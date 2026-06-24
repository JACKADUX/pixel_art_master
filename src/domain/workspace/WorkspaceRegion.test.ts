import { describe, expect, it } from "vitest";

import {
  WORKSPACE_REGIONS,
  isWorkspaceRegion,
  resolveActiveRegion,
} from "./WorkspaceRegion";

describe("isWorkspaceRegion", () => {
  it("accepts every known region", () => {
    for (const region of WORKSPACE_REGIONS) {
      expect(isWorkspaceRegion(region)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isWorkspaceRegion("toolbar")).toBe(false);
    expect(isWorkspaceRegion("")).toBe(false);
    expect(isWorkspaceRegion(null)).toBe(false);
    expect(isWorkspaceRegion(undefined)).toBe(false);
    expect(isWorkspaceRegion(42)).toBe(false);
  });
});

describe("resolveActiveRegion", () => {
  it("activates the clicked region exclusively", () => {
    expect(resolveActiveRegion("canvas", "palette")).toBe("palette");
    expect(resolveActiveRegion(null, "layers")).toBe("layers");
  });

  it("clears the active region when clicking outside all regions", () => {
    expect(resolveActiveRegion("canvas", null)).toBeNull();
    expect(resolveActiveRegion(null, null)).toBeNull();
  });

  it("re-clicking the same region keeps it active", () => {
    expect(resolveActiveRegion("assetLibrary", "assetLibrary")).toBe(
      "assetLibrary",
    );
  });
});
