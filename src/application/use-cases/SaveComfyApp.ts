import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { touchComfyApp, type ComfyApp } from "@/domain/comfyApp/ComfyApp";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { ensureSoftwareDataPathAccess } from "./EnsureSoftwareDataPathAccess";

/** 保存（或更新）应用，并把工作流备份到软件数据路径的 comfyui_workflow 子目录下 */
export async function saveComfyApp(
  pathStore: ISoftwareDataPathStore,
  repository: IComfyAppRepository,
  app: ComfyApp,
  workflow: ComfyApiWorkflow,
): Promise<ComfyApp> {
  const softwareDataPath = await ensureSoftwareDataPathAccess(pathStore);
  if (!softwareDataPath) {
    throw new Error("未设置软件数据路径，请先在设置中选择软件数据路径");
  }
  const updated = touchComfyApp(app);
  await repository.save(softwareDataPath, updated, workflow);
  return updated;
}
