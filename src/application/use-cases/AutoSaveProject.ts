import type { Project } from "@/domain/project/Project";
import { getRecoveryFilePath } from "@/infrastructure/storage/RecoveryPath";
import type { IProjectRepository } from "../ports/IProjectRepository";
import { saveProject } from "./SaveProject";

export async function autoSaveProject(
  repository: IProjectRepository,
  project: Project,
): Promise<Project> {
  const filePath = project.filePath ?? (await getRecoveryFilePath(project.id));
  return saveProject(repository, project, filePath);
}
