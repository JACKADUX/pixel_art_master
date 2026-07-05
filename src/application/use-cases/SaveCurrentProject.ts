import type { Project } from "@/domain/project/Project";
import { isPathInSoftwareDataPath } from "@/domain/softwareDataPath/SoftwareDataPath";
import { cleanupRecoveryFile } from "@/infrastructure/storage/RecoveryPath";
import { exists } from "@tauri-apps/plugin-fs";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";
import { ensureSoftwareDataPathAccess } from "./EnsureSoftwareDataPathAccess";
import { getPersistedProjectPath } from "./ProjectPersistence";
import { resolveProjectSavePath } from "./ResolveProjectSavePath";
import { saveLastOpenedProject } from "./SaveLastOpenedProject";
import { saveProject } from "./SaveProject";

export type SaveCurrentProjectFailureReason =
  | "noSoftwareDataPath"
  | "accessDenied"
  | "ioError";

export interface SaveCurrentProjectResult {
  saved: boolean;
  project: Project | null;
  reason?: SaveCurrentProjectFailureReason;
}

async function recordSavedProject(
  lastOpenedStore: ILastOpenedProjectStore,
  softwareDataPath: string,
  saved: Project,
): Promise<SaveCurrentProjectResult> {
  if (saved.filePath) {
    await saveLastOpenedProject(lastOpenedStore, softwareDataPath, saved.filePath);
  }
  return { saved: true, project: saved };
}

async function saveAndVerifyProject(
  repository: IProjectRepository,
  project: Project,
  targetPath: string,
  softwareDataPath: string | null,
): Promise<Project | null> {
  const saved = await saveProject(repository, project, targetPath, softwareDataPath);
  return (await exists(targetPath)) ? saved : null;
}

async function saveToSoftwareDataPath(
  repository: IProjectRepository,
  pathStore: ISoftwareDataPathStore,
  lastOpenedStore: ILastOpenedProjectStore,
  project: Project,
): Promise<SaveCurrentProjectResult> {
  const accessiblePath = await ensureSoftwareDataPathAccess(pathStore);
  if (!accessiblePath) {
    return { saved: false, project: null, reason: "accessDenied" };
  }

  const targetPath = await resolveProjectSavePath(pathStore, project.name);
  if (!targetPath) {
    return { saved: false, project: null, reason: "ioError" };
  }

  const saved = await saveAndVerifyProject(
    repository,
    project,
    targetPath,
    accessiblePath,
  );
  if (!saved) {
    return { saved: false, project: null, reason: "ioError" };
  }

  await cleanupRecoveryFile(project.id);
  return recordSavedProject(lastOpenedStore, accessiblePath, saved);
}

export async function saveCurrentProject(
  repository: IProjectRepository,
  pathStore: ISoftwareDataPathStore,
  lastOpenedStore: ILastOpenedProjectStore,
  project: Project,
): Promise<SaveCurrentProjectResult> {
  const persistedPath = getPersistedProjectPath(project);
  const softwareDataPath = pathStore.getPath();

  if (!softwareDataPath && !persistedPath) {
    return { saved: false, project: null, reason: "noSoftwareDataPath" };
  }

  if (persistedPath) {
    const inSoftwareDataPath =
      softwareDataPath && isPathInSoftwareDataPath(persistedPath, softwareDataPath);

    if (inSoftwareDataPath && softwareDataPath) {
      const accessiblePath = await ensureSoftwareDataPathAccess(pathStore);
      if (!accessiblePath) {
        return { saved: false, project: null, reason: "accessDenied" };
      }

      const saved = await saveAndVerifyProject(
        repository,
        project,
        persistedPath,
        accessiblePath,
      );
      if (!saved) {
        return { saved: false, project: null, reason: "ioError" };
      }

      await cleanupRecoveryFile(project.id);
      return recordSavedProject(lastOpenedStore, accessiblePath, saved);
    } else if (!softwareDataPath) {
      const saved = await saveAndVerifyProject(
        repository,
        project,
        persistedPath,
        null,
      );
      if (!saved) {
        return { saved: false, project: null, reason: "ioError" };
      }

      return { saved: true, project: saved };
    }
  }

  try {
    return await saveToSoftwareDataPath(repository, pathStore, lastOpenedStore, project);
  } catch {
    return { saved: false, project: null, reason: "ioError" };
  }
}
