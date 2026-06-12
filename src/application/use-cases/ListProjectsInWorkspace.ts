import { compareByUpdatedAtDesc } from "@/domain/project/ProjectSummary";
import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import type { IProjectRepository } from "../ports/IProjectRepository";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";

export async function listProjectsInWorkspace(
  repository: IProjectRepository,
  workspaceStore: IProjectsWorkspaceStore,
): Promise<ProjectSummary[]> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) {
    return [];
  }
  const summaries = await repository.listSummariesInDirectory(workspacePath);
  return summaries.sort(compareByUpdatedAtDesc);
}
