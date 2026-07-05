import { renameProject } from "@/domain/project/Project";
import type { Project } from "@/domain/project/Project";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";
import { loadProject } from "./LoadProject";
import { resolveRenamedProjectSavePath } from "./ResolveProjectSavePath";
import { saveProject } from "./SaveProject";

export interface RenameProjectResult {
  project: Project;
  filePath: string;
}

export async function renameProjectInSoftwareDataPath(
  repository: IProjectRepository,
  pathStore: ISoftwareDataPathStore,
  filePath: string,
  newName: string,
): Promise<RenameProjectResult | null> {
  const softwareDataPath = pathStore.getPath();
  if (!softwareDataPath) {
    throw new Error("未设置软件数据路径");
  }

  const loaded = await loadProject(repository, filePath, softwareDataPath);
  const renamed = renameProject(loaded, newName);
  if (!renamed) {
    return null;
  }

  const targetPath = await resolveRenamedProjectSavePath(
    softwareDataPath,
    renamed.name,
    filePath,
  );
  const saved = await saveProject(repository, renamed, targetPath, softwareDataPath);

  if (targetPath !== filePath) {
    await repository.delete(filePath, softwareDataPath);
  }

  return { project: saved, filePath: targetPath };
}
