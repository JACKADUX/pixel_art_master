import type { Project } from "@/domain/project/Project";
import { touchProject } from "@/domain/project/Project";
import { getRecoveryFilePath } from "@/infrastructure/storage/RecoveryPath";
import type { IProjectRepository } from "../ports/IProjectRepository";
import { getPersistedProjectPath } from "./ProjectPersistence";

export async function autoSaveProject(
  repository: IProjectRepository,
  project: Project,
): Promise<Project> {
  const persistedPath = getPersistedProjectPath(project);
  const targetPath = persistedPath ?? (await getRecoveryFilePath(project.id));
  const payload = touchProject({ ...project, filePath: targetPath });
  await repository.save(payload, targetPath);
  return touchProject(project);
}
