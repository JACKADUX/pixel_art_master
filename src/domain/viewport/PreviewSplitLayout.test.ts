import { describe, expect, it } from "vitest";
import { resolvePreviewSplitDirection } from "./PreviewSplitLayout";

describe("resolvePreviewSplitDirection", () => {
  it("uses horizontal split for landscape preview areas", () => {
    expect(resolvePreviewSplitDirection(1200, 800)).toBe("horizontal");
    expect(resolvePreviewSplitDirection(800, 800)).toBe("horizontal");
  });

  it("uses vertical split for portrait preview areas", () => {
    expect(resolvePreviewSplitDirection(600, 900)).toBe("vertical");
  });

  it("defaults to vertical when size is unavailable", () => {
    expect(resolvePreviewSplitDirection(0, 0)).toBe("vertical");
  });
});
