import { renameProject } from "@/domain/project/Project";
import type { Project } from "@/domain/project/Project";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";
import { loadProject } from "./LoadProject";
import { resolveRenamedProjectSavePath } from "./ResolveProjectSavePath";
import { saveProject } from "./SaveProject";

export interface RenameProjectResult {
  project: Project;
  filePath: string;
}

export async function renameProjectInWorkspace(
  repository: IProjectRepository,
  workspaceStore: IProjectsWorkspaceStore,
  filePath: string,
  newName: string,
): Promise<RenameProjectResult | null> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) {
    throw new Error("未设置项目目录");
  }

  const loaded = await loadProject(repository, filePath);
  const renamed = renameProject(loaded, newName);
  if (!renamed) {
    return null;
  }

  const targetPath = await resolveRenamedProjectSavePath(
    workspacePath,
    renamed.name,
    filePath,
  );
  const saved = await saveProject(repository, renamed, targetPath);

  if (targetPath !== filePath) {
    await repository.delete(filePath);
  }

  return { project: saved, filePath: targetPath };
}
