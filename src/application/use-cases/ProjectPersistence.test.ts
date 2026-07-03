import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import { getPersistedProjectPath } from "./ProjectPersistence";

describe("getPersistedProjectPath", () => {
  it("returns null when project has no file path", () => {
    const project = createEmptyProject("test");
    expect(getPersistedProjectPath(project)).toBeNull();
  });

  it("returns null for auto-save recovery paths", () => {
    const project = {
      ...createEmptyProject("test"),
      filePath: "C:/Users/me/AppData/pixelart-master/autosave/abc.pixelart.json",
    };
    expect(getPersistedProjectPath(project)).toBeNull();
  });

  it("returns workspace path for explicitly saved projects", () => {
    const project = {
      ...createEmptyProject("test"),
      filePath: "D:/Projects/my-workspace/test.pixelart.json",
    };
    expect(getPersistedProjectPath(project)).toBe("D:/Projects/my-workspace/test.pixelart.json");
  });
});
