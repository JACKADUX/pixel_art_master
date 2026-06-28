import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import { duplicateComfyApp, type ComfyApp } from "@/domain/comfyApp/ComfyApp";
import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";

/** 复制应用：载入原记录 → 生成新 id 副本 → 另存（含工作流备份） */
export async function duplicateComfyAppToWorkspace(
  workspaceStore: IProjectsWorkspaceStore,
  repository: IComfyAppRepository,
  appId: string,
): Promise<ComfyApp | null> {
  const workspacePath = await ensureWorkspaceAccess(workspaceStore);
  if (!workspacePath) {
    throw new Error("未设置项目文件夹，请先在设置中选择项目文件夹");
  }
  const record = await repository.load(workspacePath, appId);
  if (!record) return null;

  const copy = duplicateComfyApp(record.app);
  await repository.save(workspacePath, copy, record.workflow);
  return copy;
}
