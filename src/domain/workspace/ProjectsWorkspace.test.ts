import { describe, expect, it } from "vitest";
import { isPathInWorkspace } from "./ProjectsWorkspace";

describe("isPathInWorkspace", () => {
  it("matches files directly under the workspace directory", () => {
    expect(
      isPathInWorkspace(
        "D:/Projects/workspace/demo.pixelart.json",
        "D:/Projects/workspace",
      ),
    ).toBe(true);
  });

  it("matches nested files and ignores trailing separators", () => {
    expect(
      isPathInWorkspace(
        "D:/Projects/workspace/sub/demo.pixelart.json",
        "D:/Projects/workspace/",
      ),
    ).toBe(true);
  });

  it("does not match sibling directories with similar prefixes", () => {
    expect(
      isPathInWorkspace(
        "D:/Projects/workspace-backup/demo.pixelart.json",
        "D:/Projects/workspace",
      ),
    ).toBe(false);
  });
});
