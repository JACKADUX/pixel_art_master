import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { ensureSoftwareDataPathAccess } from "./EnsureSoftwareDataPathAccess";

/** 删除应用整个备份子目录 */
export async function deleteComfyApp(
  pathStore: ISoftwareDataPathStore,
  repository: IComfyAppRepository,
  appId: string,
): Promise<void> {
  const softwareDataPath = await ensureSoftwareDataPathAccess(pathStore);
  if (!softwareDataPath) {
    throw new Error("未设置软件数据路径，请先在设置中选择软件数据路径");
  }
  await repository.delete(softwareDataPath, appId);
}
