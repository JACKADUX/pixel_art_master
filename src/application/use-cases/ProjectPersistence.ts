import type { Project } from "@/domain/project/Project";
import { isRecoveryPath } from "@/infrastructure/storage/RecoveryPath";

/** 用户显式保存过的项目路径；自动保存恢复文件不算持久化路径。 */
export function getPersistedProjectPath(project: Project): string | null {
  if (!project.filePath || isRecoveryPath(project.filePath)) {
    return null;
  }
  return project.filePath;
}
