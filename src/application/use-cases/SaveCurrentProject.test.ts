import { describe, expect, it, vi } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";
import { saveCurrentProject } from "./SaveCurrentProject";

vi.mock("./EnsureWorkspaceAccess", () => ({
  ensureWorkspaceAccess: vi.fn(async () => "/workspace"),
}));

vi.mock("./ResolveProjectSavePath", () => ({
  resolveProjectSavePath: vi.fn(async () => "/workspace/test.pixelart.json"),
  resolveDefaultSavePath: vi.fn(async () => "/workspace/test.pixelart.json"),
}));

import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";
import { resolveProjectSavePath } from "./ResolveProjectSavePath";

function createDeps(overrides?: {
  workspacePath?: string | null;
  promptSaveAs?: (defaultPath: string | null) => Promise<string | null>;
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
    addRecent: vi.fn(),
    removeRecent: vi.fn(),
    getRecent: vi.fn(() => []),
  };

  const workspaceStore: IProjectsWorkspaceStore = {
    getPath: () => overrides?.workspacePath ?? "/workspace",
    setPath: vi.fn(),
  };

  const lastOpenedStore: ILastOpenedProjectStore = {
    getPath: () => lastOpenedPaths.at(-1) ?? null,
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
    promptSaveAs:
      overrides?.promptSaveAs ??
      (async () => {
        throw new Error("promptSaveAs should not be called");
      }),
  };
}

describe("saveCurrentProject", () => {
  it("saves a new project to workspace after ensuring access", async () => {
    const deps = createDeps();
    const project = createEmptyProject("new-project");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
      deps.promptSaveAs,
    );

    expect(ensureWorkspaceAccess).toHaveBeenCalledWith(deps.workspaceStore);
    expect(resolveProjectSavePath).toHaveBeenCalledWith(deps.workspaceStore, "new-project");
    expect(deps.savedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(deps.lastOpenedPaths).toEqual(["/workspace/test.pixelart.json"]);
    expect(result.saved).toBe(true);
    expect(result.project?.filePath).toBe("/workspace/test.pixelart.json");
  });

  it("falls back to save-as when workspace is inaccessible", async () => {
    vi.mocked(ensureWorkspaceAccess).mockResolvedValueOnce(null);
    const deps = createDeps({
      promptSaveAs: async () => "/custom/save.pixelart.json",
    });
    const project = createEmptyProject("fallback");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
      deps.promptSaveAs,
    );

    expect(deps.savedPaths).toEqual(["/custom/save.pixelart.json"]);
    expect(result.saved).toBe(true);
    expect(result.project?.filePath).toBe("/custom/save.pixelart.json");
  });

  it("returns saved=false when save-as is cancelled", async () => {
    vi.mocked(ensureWorkspaceAccess).mockResolvedValueOnce(null);
    const deps = createDeps({
      workspacePath: null,
      promptSaveAs: async () => null,
    });
    const project = createEmptyProject("cancelled");

    const result = await saveCurrentProject(
      deps.repository,
      deps.workspaceStore,
      deps.lastOpenedStore,
      project,
      deps.promptSaveAs,
    );

    expect(result.saved).toBe(false);
    expect(result.project).toBeNull();
    expect(deps.savedPaths).toEqual([]);
  });
});
