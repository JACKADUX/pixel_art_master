import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";

/** 删除应用整个备份子目录 */
export async function deleteComfyApp(
  workspaceStore: IProjectsWorkspaceStore,
  repository: IComfyAppRepository,
  appId: string,
): Promise<void> {
  const workspacePath = await ensureWorkspaceAccess(workspaceStore);
  if (!workspacePath) {
    throw new Error("未设置项目文件夹，请先在设置中选择项目文件夹");
  }
  await repository.delete(workspacePath, appId);
}
