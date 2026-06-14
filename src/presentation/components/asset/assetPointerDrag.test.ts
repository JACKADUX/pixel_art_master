import { describe, expect, it, vi } from "vitest";
import {
  DRAG_THRESHOLD_PX,
  FOLDER_DROP_TARGET_ATTR,
  hasDragMovement,
  resolveFolderIdFromElement,
} from "./assetPointerDrag";

describe("hasDragMovement", () => {
  it("returns false when movement is below threshold", () => {
    expect(hasDragMovement(3, 3)).toBe(false);
    expect(hasDragMovement(DRAG_THRESHOLD_PX - 1, 0)).toBe(false);
  });

  it("returns true when movement reaches threshold", () => {
    expect(hasDragMovement(DRAG_THRESHOLD_PX, 0)).toBe(true);
    expect(hasDragMovement(6, 6)).toBe(true);
  });
});

describe("resolveFolderIdFromElement", () => {
  it("returns folder id when element is a folder row", () => {
    const row = {
      closest: () => null,
      getAttribute: (name: string) =>
        name === FOLDER_DROP_TARGET_ATTR ? "folder-abc" : null,
    } as unknown as Element;

    vi.spyOn(row, "closest").mockReturnValue(row);

    expect(resolveFolderIdFromElement(row)).toBe("folder-abc");
  });

  it("returns folder id when element is inside a folder row", () => {
    const row = {
      getAttribute: (name: string) =>
        name === FOLDER_DROP_TARGET_ATTR ? "__root__" : null,
    } as unknown as Element;
    const button = {
      closest: (selector: string) =>
        selector === `[${FOLDER_DROP_TARGET_ATTR}]` ? row : null,
    } as unknown as Element;

    expect(resolveFolderIdFromElement(button)).toBe("__root__");
  });

  it("returns null when element is not inside a folder row", () => {
    const div = {
      closest: () => null,
    } as unknown as Element;

    expect(resolveFolderIdFromElement(div)).toBeNull();
  });

  it("returns null when element is null", () => {
    expect(resolveFolderIdFromElement(null)).toBeNull();
  });
});
