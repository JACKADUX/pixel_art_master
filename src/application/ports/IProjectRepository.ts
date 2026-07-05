import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import type { Project } from "@/domain/project/Project";

export interface IProjectRepository {
  save(project: Project, filePath: string, softwareDataPath: string | null): Promise<void>;
  load(filePath: string, softwareDataPath: string | null): Promise<Project>;
  listSummariesInDirectory(dir: string): Promise<ProjectSummary[]>;
  delete(filePath: string, softwareDataPath: string | null): Promise<void>;
  getRecent(softwareDataPath: string): Promise<string[]>;
}
