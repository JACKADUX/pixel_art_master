import type { Project } from "@/domain/project/Project";
import { isPathInWorkspace } from "@/domain/workspace/ProjectsWorkspace";
import { cleanupRecoveryFile } from "@/infrastructure/storage/RecoveryPath";
import { exists } from "@tauri-apps/plugin-fs";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";
import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";
import { getPersistedProjectPath } from "./ProjectPersistence";
import { resolveProjectSavePath } from "./ResolveProjectSavePath";
import { saveLastOpenedProject } from "./SaveLastOpenedProject";
import { saveProject } from "./SaveProject";

export type SaveCurrentProjectFailureReason =
  | "noWorkspace"
  | "accessDenied"
  | "ioError";

export interface SaveCurrentProjectResult {
  saved: boolean;
  project: Project | null;
  reason?: SaveCurrentProjectFailureReason;
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

async function saveAndVerifyProject(
  repository: IProjectRepository,
  project: Project,
  targetPath: string,
): Promise<Project | null> {
  const saved = await saveProject(repository, project, targetPath);
  return (await exists(targetPath)) ? saved : null;
}

async function saveToWorkspace(
  repository: IProjectRepository,
  workspaceStore: IProjectsWorkspaceStore,
  lastOpenedStore: ILastOpenedProjectStore,
  project: Project,
): Promise<SaveCurrentProjectResult> {
  const accessiblePath = await ensureWorkspaceAccess(workspaceStore);
  if (!accessiblePath) {
    return { saved: false, project: null, reason: "accessDenied" };
  }

  const targetPath = await resolveProjectSavePath(workspaceStore, project.name);
  if (!targetPath) {
    return { saved: false, project: null, reason: "ioError" };
  }

  const saved = await saveAndVerifyProject(repository, project, targetPath);
  if (!saved) {
    return { saved: false, project: null, reason: "ioError" };
  }

  await cleanupRecoveryFile(project.id);
  return recordSavedProject(lastOpenedStore, saved);
}

export async function saveCurrentProject(
  repository: IProjectRepository,
  workspaceStore: IProjectsWorkspaceStore,
  lastOpenedStore: ILastOpenedProjectStore,
  project: Project,
): Promise<SaveCurrentProjectResult> {
  const persistedPath = getPersistedProjectPath(project);
  const workspacePath = workspaceStore.getPath();

  if (!workspacePath && !persistedPath) {
    return { saved: false, project: null, reason: "noWorkspace" };
  }

  if (persistedPath) {
    const inWorkspace = workspacePath && isPathInWorkspace(persistedPath, workspacePath);

    if (inWorkspace) {
      const accessiblePath = await ensureWorkspaceAccess(workspaceStore);
      if (!accessiblePath) {
        return { saved: false, project: null, reason: "accessDenied" };
      }

      const saved = await saveAndVerifyProject(repository, project, persistedPath);
      if (!saved) {
        return { saved: false, project: null, reason: "ioError" };
      }

      await cleanupRecoveryFile(project.id);
      return recordSavedProject(lastOpenedStore, saved);
    } else if (!workspacePath) {
      const saved = await saveAndVerifyProject(repository, project, persistedPath);
      if (!saved) {
        return { saved: false, project: null, reason: "ioError" };
      }

      return recordSavedProject(lastOpenedStore, saved);
    }
  }

  try {
    return await saveToWorkspace(repository, workspaceStore, lastOpenedStore, project);
  } catch {
    return { saved: false, project: null, reason: "ioError" };
  }
}
