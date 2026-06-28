import { buildWorldFilePath } from "@/domain/world/WorldWorkspace";
import { exists } from "@tauri-apps/plugin-fs";
import type { IWorldsWorkspaceStore } from "../ports/IWorldsWorkspaceStore";

export async function resolveWorldSavePath(
  workspaceStore: IWorldsWorkspaceStore,
  worldName: string,
): Promise<string | null> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) {
    return null;
  }

  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = buildWorldFilePath(workspacePath, worldName, suffix);
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  return buildWorldFilePath(workspacePath, worldName, Date.now());
}

export async function resolveRenamedWorldSavePath(
  workspacePath: string,
  worldName: string,
  currentFilePath: string,
): Promise<string> {
  const normalizedCurrent = currentFilePath.replace(/\\/g, "/");
  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = buildWorldFilePath(workspacePath, worldName, suffix);
    const normalizedCandidate = candidate.replace(/\\/g, "/");
    if (normalizedCandidate === normalizedCurrent || !(await exists(candidate))) {
      return candidate;
    }
  }
  return buildWorldFilePath(workspacePath, worldName, Date.now());
}
