import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import { touchComfyApp, type ComfyApp } from "@/domain/comfyApp/ComfyApp";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";

/** 保存（或更新）应用，并把工作流备份到项目路径的 comfyui_workflow 子目录下 */
export async function saveComfyApp(
  workspaceStore: IProjectsWorkspaceStore,
  repository: IComfyAppRepository,
  app: ComfyApp,
  workflow: ComfyApiWorkflow,
): Promise<ComfyApp> {
  const workspacePath = await ensureWorkspaceAccess(workspaceStore);
  if (!workspacePath) {
    throw new Error("未设置项目文件夹，请先在设置中选择项目文件夹");
  }
  const updated = touchComfyApp(app);
  await repository.save(workspacePath, updated, workflow);
  return updated;
}
