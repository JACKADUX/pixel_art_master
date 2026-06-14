import type { Project } from "@/domain/project/Project";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";
import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";
import { resolveDefaultSavePath, resolveProjectSavePath } from "./ResolveProjectSavePath";
import { saveLastOpenedProject } from "./SaveLastOpenedProject";
import { saveProject } from "./SaveProject";

export interface SaveCurrentProjectResult {
  saved: boolean;
  project: Project | null;
}

function recordSavedProject(
  lastOpenedStore: ILastOpenedProjectStore,
  saved: Project,
): SaveCurrentProjectResult {
  if (saved.filePath) {
    saveLastOpenedProject(lastOpenedStore, saved.filePath);
  }
  return { saved: true, project: saved };
}

async function saveToWorkspace(
  repository: IProjectRepository,
  workspaceStore: IProjectsWorkspaceStore,
  lastOpenedStore: ILastOpenedProjectStore,
  project: Project,
): Promise<SaveCurrentProjectResult | null> {
  const accessiblePath = await ensureWorkspaceAccess(workspaceStore);
  if (!accessiblePath) {
    return null;
  }

  const targetPath = await resolveProjectSavePath(workspaceStore, project.name);
  if (!targetPath) {
    return null;
  }

  const saved = await saveProject(repository, project, targetPath);
  return recordSavedProject(lastOpenedStore, saved);
}

export async function saveCurrentProject(
  repository: IProjectRepository,
  workspaceStore: IProjectsWorkspaceStore,
  lastOpenedStore: ILastOpenedProjectStore,
  project: Project,
  promptSaveAs: (defaultPath: string | null) => Promise<string | null>,
): Promise<SaveCurrentProjectResult> {
  if (project.filePath) {
    const saved = await saveProject(repository, project, project.filePath);
    return recordSavedProject(lastOpenedStore, saved);
  }

  if (workspaceStore.getPath()) {
    try {
      const result = await saveToWorkspace(repository, workspaceStore, lastOpenedStore, project);
      if (result) {
        return result;
      }
    } catch {
      // fall through to save-as dialog
    }
  }

  const defaultPath = await resolveDefaultSavePath(workspaceStore, project.name);
  const selected = await promptSaveAs(defaultPath);
  if (!selected) {
    return { saved: false, project: null };
  }

  const saved = await saveProject(repository, project, selected);
  return recordSavedProject(lastOpenedStore, saved);
}
