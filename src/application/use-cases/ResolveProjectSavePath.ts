import { buildProjectFilePath } from "@/domain/workspace/ProjectsWorkspace";
import { exists } from "@tauri-apps/plugin-fs";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";

export async function resolveProjectSavePath(
  workspaceStore: IProjectsWorkspaceStore,
  projectName: string,
): Promise<string | null> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) {
    return null;
  }

  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = buildProjectFilePath(workspacePath, projectName, suffix);
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  return buildProjectFilePath(workspacePath, projectName, Date.now());
}

export async function resolveDefaultSavePath(
  workspaceStore: IProjectsWorkspaceStore,
  projectName: string,
): Promise<string | null> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) {
    return null;
  }
  return buildProjectFilePath(workspacePath, projectName, 0);
}

export async function resolveRenamedProjectSavePath(
  workspacePath: string,
  projectName: string,
  currentFilePath: string,
): Promise<string> {
  const normalizedCurrent = currentFilePath.replace(/\\/g, "/");
  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = buildProjectFilePath(workspacePath, projectName, suffix);
    const normalizedCandidate = candidate.replace(/\\/g, "/");
    if (normalizedCandidate === normalizedCurrent || !(await exists(candidate))) {
      return candidate;
    }
  }
  return buildProjectFilePath(workspacePath, projectName, Date.now());
}
