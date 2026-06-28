import type {
  ComfyAppRecord,
  IComfyAppRepository,
} from "@/application/ports/IComfyAppRepository";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import { ensureWorkspaceAccess } from "./EnsureWorkspaceAccess";

/** 读取单个应用的完整记录（含备份工作流） */
export async function loadComfyApp(
  workspaceStore: IProjectsWorkspaceStore,
  repository: IComfyAppRepository,
  appId: string,
): Promise<ComfyAppRecord | null> {
  const workspacePath = await ensureWorkspaceAccess(workspaceStore);
  if (!workspacePath) {
    throw new Error("未设置项目文件夹，请先在设置中选择项目文件夹");
  }
  return repository.load(workspacePath, appId);
}
