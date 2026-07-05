import { describe, expect, it } from "vitest";
import { isPathInSoftwareDataPath } from "./SoftwareDataPath";

describe("isPathInSoftwareDataPath", () => {
  it("matches files directly under the software data path", () => {
    expect(
      isPathInSoftwareDataPath(
        "D:/Data/demo.pixelart.json",
        "D:/Data",
      ),
    ).toBe(true);
  });

  it("matches nested files and ignores trailing separators", () => {
    expect(
      isPathInSoftwareDataPath(
        "D:/Data/sub/demo.pixelart.json",
        "D:/Data/",
      ),
    ).toBe(true);
  });

  it("does not match sibling directories with similar prefixes", () => {
    expect(
      isPathInSoftwareDataPath(
        "D:/Data-backup/demo.pixelart.json",
        "D:/Data",
      ),
    ).toBe(false);
  });
});
