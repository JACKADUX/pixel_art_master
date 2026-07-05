import { buildProjectFilePath } from "@/domain/softwareDataPath/SoftwareDataPath";
import { exists } from "@tauri-apps/plugin-fs";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";

export async function resolveProjectSavePath(
  pathStore: ISoftwareDataPathStore,
  projectName: string,
): Promise<string | null> {
  const softwareDataPath = pathStore.getPath();
  if (!softwareDataPath) {
    return null;
  }

  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = buildProjectFilePath(softwareDataPath, projectName, suffix);
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  return buildProjectFilePath(softwareDataPath, projectName, Date.now());
}

export async function resolveDefaultSavePath(
  pathStore: ISoftwareDataPathStore,
  projectName: string,
): Promise<string | null> {
  const softwareDataPath = pathStore.getPath();
  if (!softwareDataPath) {
    return null;
  }
  return buildProjectFilePath(softwareDataPath, projectName, 0);
}

export async function resolveRenamedProjectSavePath(
  softwareDataPath: string,
  projectName: string,
  currentFilePath: string,
): Promise<string> {
  const normalizedCurrent = currentFilePath.replace(/\\/g, "/");
  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = buildProjectFilePath(softwareDataPath, projectName, suffix);
    const normalizedCandidate = candidate.replace(/\\/g, "/");
    if (normalizedCandidate === normalizedCurrent || !(await exists(candidate))) {
      return candidate;
    }
  }
  return buildProjectFilePath(softwareDataPath, projectName, Date.now());
}
