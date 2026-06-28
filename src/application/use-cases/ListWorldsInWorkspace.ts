import { compareByUpdatedAtDesc } from "@/domain/world/WorldSummary";
import type { WorldSummary } from "@/domain/world/WorldSummary";
import type { IWorldRepository } from "../ports/IWorldRepository";
import type { IWorldsWorkspaceStore } from "../ports/IWorldsWorkspaceStore";

export async function listWorldsInWorkspace(
  repository: IWorldRepository,
  workspaceStore: IWorldsWorkspaceStore,
): Promise<WorldSummary[]> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) {
    return [];
  }
  const summaries = await repository.listSummariesInDirectory(workspacePath);
  return summaries.sort(compareByUpdatedAtDesc);
}
