import type { Project } from "@/domain/project/Project";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import { loadProject } from "./LoadProject";

export async function openLastProjectOnStartup(
  store: ILastOpenedProjectStore,
  repository: IProjectRepository,
  softwareDataPath: string,
): Promise<Project | null> {
  const path = await store.getPath(softwareDataPath);
  if (!path) return null;

  try {
    return await loadProject(repository, path, softwareDataPath);
  } catch {
    await store.clearPath(softwareDataPath);
    return null;
  }
}
