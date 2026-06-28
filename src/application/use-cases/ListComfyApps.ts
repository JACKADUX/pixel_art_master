import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import type { ComfyApp } from "@/domain/comfyApp/ComfyApp";

/** 列出已保存的应用；未设置项目路径或目录不存在时返回空列表（不弹授权对话框） */
export async function listComfyApps(
  workspaceStore: IProjectsWorkspaceStore,
  repository: IComfyAppRepository,
): Promise<ComfyApp[]> {
  const workspacePath = workspaceStore.getPath();
  if (!workspacePath) return [];
  try {
    return await repository.list(workspacePath);
  } catch {
    return [];
  }
}
