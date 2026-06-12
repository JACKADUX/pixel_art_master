import type { Project } from "@/domain/project/Project";
import { getRecoveryFilePath } from "@/infrastructure/storage/RecoveryPath";
import { remove } from "@tauri-apps/plugin-fs";
import type { IProjectRepository } from "../ports/IProjectRepository";

export interface DeleteProjectResult {
  shouldReset: boolean;
}

export async function deleteProject(
  repository: IProjectRepository,
  filePath: string,
  currentProject: Project | null,
): Promise<DeleteProjectResult> {
  await repository.delete(filePath);

  const shouldReset = currentProject?.filePath === filePath;

  if (shouldReset && currentProject) {
    try {
      const recoveryPath = await getRecoveryFilePath(currentProject.id);
      await remove(recoveryPath).catch(() => {});
    } catch {
      // ignore recovery cleanup errors
    }
  }

  return { shouldReset };
}
