import type { Project } from "@/domain/project/Project";
import type { IProjectRepository } from "../ports/IProjectRepository";

export async function loadProject(
  repository: IProjectRepository,
  filePath: string,
  softwareDataPath: string | null,
): Promise<Project> {
  const project = await repository.load(filePath, softwareDataPath);
  return { ...project, filePath };
}
