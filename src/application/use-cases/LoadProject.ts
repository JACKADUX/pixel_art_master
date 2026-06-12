import type { Project } from "@/domain/project/Project";
import type { IProjectRepository } from "../ports/IProjectRepository";

export async function loadProject(
  repository: IProjectRepository,
  filePath: string,
): Promise<Project> {
  const project = await repository.load(filePath);
  return { ...project, filePath };
}
