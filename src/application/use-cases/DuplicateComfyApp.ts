import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { duplicateComfyApp, type ComfyApp } from "@/domain/comfyApp/ComfyApp";
import { ensureSoftwareDataPathAccess } from "./EnsureSoftwareDataPathAccess";

/** 复制应用：载入原记录 → 生成新 id 副本 → 另存（含工作流备份） */
export async function duplicateComfyAppToWorkspace(
  pathStore: ISoftwareDataPathStore,
  repository: IComfyAppRepository,
  appId: string,
): Promise<ComfyApp | null> {
  const softwareDataPath = await ensureSoftwareDataPathAccess(pathStore);
  if (!softwareDataPath) {
    throw new Error("未设置软件数据路径，请先在设置中选择软件数据路径");
  }
  const record = await repository.load(softwareDataPath, appId);
  if (!record) return null;

  const copy = duplicateComfyApp(record.app);
  await repository.save(softwareDataPath, copy, record.workflow);
  return copy;
}
