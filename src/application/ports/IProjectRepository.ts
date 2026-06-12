import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import type { Project } from "@/domain/project/Project";

export interface IProjectRepository {
  save(project: Project, filePath: string): Promise<void>;
  load(filePath: string): Promise<Project>;
  listSummariesInDirectory(dir: string): Promise<ProjectSummary[]>;
  delete(filePath: string): Promise<void>;
  removeRecent(filePath: string): void;
}
