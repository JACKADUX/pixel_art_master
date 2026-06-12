import type { Project } from "@/domain/project/Project";
import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";
import type { IProjectRepository } from "../ports/IProjectRepository";
import { loadProject } from "./LoadProject";

export async function openLastProjectOnStartup(
  store: ILastOpenedProjectStore,
  repository: IProjectRepository,
): Promise<Project | null> {
  const path = store.getPath();
  if (!path) return null;

  try {
    return await loadProject(repository, path);
  } catch {
    store.clearPath();
    return null;
  }
}
