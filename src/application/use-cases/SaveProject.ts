import type { Project } from "@/domain/project/Project";
import { touchProject } from "@/domain/project/Project";
import type { IProjectRepository } from "../ports/IProjectRepository";

export async function saveProject(
  repository: IProjectRepository,
  project: Project,
  filePath: string,
  softwareDataPath: string | null,
): Promise<Project> {
  const updated = touchProject({ ...project, filePath });
  await repository.save(updated, filePath, softwareDataPath);
  return updated;
}
