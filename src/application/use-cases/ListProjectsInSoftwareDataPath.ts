import { compareByUpdatedAtDesc } from "@/domain/project/ProjectSummary";
import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";

export async function listProjectsInSoftwareDataPath(
  repository: IProjectRepository,
  pathStore: ISoftwareDataPathStore,
): Promise<ProjectSummary[]> {
  const softwareDataPath = pathStore.getPath();
  if (!softwareDataPath) {
    return [];
  }
  const summaries = await repository.listSummariesInDirectory(softwareDataPath);
  return summaries.sort(compareByUpdatedAtDesc);
}
