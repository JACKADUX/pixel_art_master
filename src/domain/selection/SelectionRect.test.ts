import { describe, expect, it } from "vitest";
import { normalizeRect } from "@/domain/selection/SelectionRect";

describe("normalizeRect", () => {
  it("includes both drag endpoints as selected pixels", () => {
    expect(normalizeRect(0, 0, 5, 0)).toEqual({ x: 0, y: 0, width: 6, height: 1 });
    expect(normalizeRect(1, 1, 3, 3)).toEqual({ x: 1, y: 1, width: 3, height: 3 });
  });

  it("keeps a single pixel when start and end are the same", () => {
    expect(normalizeRect(2, 2, 2, 2)).toEqual({ x: 2, y: 2, width: 1, height: 1 });
  });

  it("normalizes reversed drag directions", () => {
    expect(normalizeRect(4, 5, 1, 2)).toEqual({ x: 1, y: 2, width: 4, height: 4 });
  });
});
