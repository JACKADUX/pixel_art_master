import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";
import { saveCurrentProject } from "./SaveCurrentProject";

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(async () => true),
}));

vi.mock("@/infrastructure/storage/RecoveryPath", () => ({
  cleanupRecoveryFile: vi.fn(async () => {}),
  isRecoveryPath: (filePath: string) => filePath.replace(/\\/g, "/").includes("pixelart-master/autosave/"),
}));

vi.mock("./EnsureSoftwareDataPathAccess", () => ({
  ensureSoftwareDataPathAccess: vi.fn(async () => "/data"),
}));

vi.mock("./ResolveProjectSavePath", () => ({
  resolveProjectSavePath: vi.fn(async () => "/data/test.pixelart.json"),
  resolveDefaultSavePath: vi.fn(async () => "/data/test.pixelart.json"),
}));

import { ensureSoftwareDataPathAccess } from "./EnsureSoftwareDataPathAccess";
import { resolveProjectSavePath } from "./ResolveProjectSavePath";
import { exists } from "@tauri-apps/plugin-fs";

function createDeps(overrides?: {
  softwareDataPath?: string | null;
}) {
  const savedPaths: string[] = [];
  const lastOpenedPaths: string[] = [];

  const repository: IProjectRepository = {
    save: vi.fn(async (_project, filePath) => {
      savedPaths.push(filePath);
    }),
    load: vi.fn(),
    listSummariesInDirectory: vi.fn(),
    delete: vi.fn(),
    getRecent: vi.fn(async () => []),
  };

  const pathStore: ISoftwareDataPathStore = {
    getPath: () =>
      overrides && "softwareDataPath" in overrides ? (overrides.softwareDataPath ?? null) : "/data",
    setPath: vi.fn(),
  };

  const lastOpenedStore: ILastOpenedProjectStore = {
    getPath: vi.fn(async () => lastOpenedPaths[lastOpenedPaths.length - 1] ?? null),
    setPath: vi.fn(async (_softwareDataPath, path) => {
      lastOpenedPaths.push(path);
    }),
    clearPath: vi.fn(async () => {}),
  };

  return {
    repository,
    pathStore,
    lastOpenedStore,
    savedPaths,
    lastOpenedPaths,
  };
}

describe("saveCurrentProject", () => {
  beforeEach(() => {
    vi.mocked(ensureSoftwareDataPathAccess).mockResolvedValue("/data");
    vi.mocked(exists).mockResolvedValue(true);
  });

  it("saves a new project to software data path after ensuring access", async () => {
    const deps = createDeps();
    const project = createEmptyProject("new-project");

    const result = await saveCurrentProject(
      deps.repository,
      deps.pathStore,
      deps.lastOpenedStore,
      project,
    );

    expect(result.saved).toBe(true);
    expect(deps.savedPaths).toContain("/data/test.pixelart.json");
    expect(resolveProjectSavePath).toHaveBeenCalled();
  });

  it("returns noSoftwareDataPath when neither path nor persisted file exists", async () => {
    const deps = createDeps({ softwareDataPath: null });
    const project = createEmptyProject("orphan");

    const result = await saveCurrentProject(
      deps.repository,
      deps.pathStore,
      deps.lastOpenedStore,
      project,
    );

    expect(result.saved).toBe(false);
    expect(result.reason).toBe("noSoftwareDataPath");
  });
});
