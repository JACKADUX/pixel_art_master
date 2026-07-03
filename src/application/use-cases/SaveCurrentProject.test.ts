import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";
import { saveCurrentProject } from "./SaveCurrentProject";

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(async () => true),
}));

vi.mock("@/infrastructure/storage/RecoveryPath", () => ({
  cleanupRecoveryFile: vi.fn(async () => {}),
  isRecoveryPath: (filePath: string) => filePath.replace(/\\/g, "/").includes("pixelart-master/autosave/"),
}));

vi.mock("./EnsureWorkspaceAccess", () => ({
  ensureWorkspaceAccess: vi.fn(async () => "/workspace"),
}));

vi.mock("./ResolveProjectSavePath", () => ({
  resolveProjectSavePath: vi.fn(async () => "/workspace/test.pixelart.json"),
  resolveDefaultSavePath: vi.fn(async () => "/workspace/test.pixelart.json"),
}));

import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";
import { resolveProjectSavePath } from "./ResolveProjectSavePath";
import { exists } from "@tauri-apps/plugin-fs";

function createDeps(overrides?: {
  workspacePath?: string | null;
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
    removeRecent: vi.fn(),
  };

  const workspaceStore: IProjectsWorkspaceStore = {
    getPath: () =>
      overrides && "workspacePath" in overrides ? (overrides.workspacePath ?? null) : "/workspace",
    setPath: vi.fn(),
  };

  const lastOpenedStore: ILastOpenedProjectStore = {
    getPath: () => lastOpenedPaths[lastOpenedPaths.length - 1] ?? null,
    setPath: (path) => {
      lastOpenedPaths.push(path);
    },
    clearPath: vi.fn(),
  };

  return {
    repository,
    workspaceStore,
    lastOpenedStore,
    savedPaths,
    lastOpenedPaths,
  };
}

describe("saveCurrentProject", () => {
  beforeEach(() => {
    vi.mocked(ensureWorkspaceAccess).mockResolvedValue("/workspace");
    vi.mocked(exists).mockResolvedValue(true);
  });

  it("saves a new project to workspace after ensuring access", async () => {
    const deps = createDeps();
    const project = createEmptyProject("new-project");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
    );

    expect(ensureWorkspaceAccess).toHaveBeenCalledWith(deps.workspaceStore);
    expect(resolveProjectSavePath).toHaveBeenCalledWith(deps.workspaceStore, "new-project");
    expect(exists).toHaveBeenCalledWith("/workspace/test.pixelart.json");
    expect(deps.savedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(deps.lastOpenedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(result.saved).toBe(true);
    expect(result.project?.filePath).toBe("/workspace/test.pixelart.json");
  });

  it("returns accessDenied without save-as fallback when workspace is inaccessible", async () => {
    vi.mocked(ensureWorkspaceAccess).mockResolvedValueOnce(null);
    const deps = createDeps();
    const project = createEmptyProject("fallback");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
    );

    expect(deps.savedPaths).toEqual([]);
    expect(result.saved).toBe(false);
    expect(result.reason).toBe("accessDenied");
  });

  it("returns noWorkspace when workspace has not been configured", async () => {
    const deps = createDeps({
      workspacePath: null,
    });
    const project = createEmptyProject("cancelled");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
    );

    expect(result.saved).toBe(false);
    expect(result.project).toBeNull();
    expect(result.reason).toBe("noWorkspace");
    expect(deps.savedPaths).toEqual([]);
  });

  it("saves to workspace when filePath points to auto-save recovery file", async () => {
    const deps = createDeps();
    const project = {
      ...createEmptyProject("recovery-project"),
      filePath: "C:/Users/me/AppData/pixelart-master/autosave/recovery.pixelart.json",
    };

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
    );

    expect(ensureWorkspaceAccess).toHaveBeenCalledWith(deps.workspaceStore);
    expect(resolveProjectSavePath).toHaveBeenCalledWith(deps.workspaceStore, "recovery-project");
    expect(deps.savedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(result.saved).toBe(true);
    expect(result.project?.filePath).toBe("/workspace/test.pixelart.json");
  });

  it("copies an external saved project into workspace on current save", async () => {
    const deps = createDeps();
    const project = {
      ...createEmptyProject("external-project"),
      filePath: "D:/outside/external-project.pixelart.json",
    };

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
    );

    expect(resolveProjectSavePath).toHaveBeenCalledWith(deps.workspaceStore, "external-project");
    expect(deps.savedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(result.saved).toBe(true);
    expect(result.project?.filePath).toBe("/workspace/test.pixelart.json");
  });

  it("returns ioError when saved file cannot be verified", async () => {
    vi.mocked(exists).mockResolvedValueOnce(false);
    const deps = createDeps();
    const project = createEmptyProject("missing-after-save");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
    );

    expect(deps.savedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(result.saved).toBe(false);
    expect(result.reason).toBe("ioError");
  });
});
