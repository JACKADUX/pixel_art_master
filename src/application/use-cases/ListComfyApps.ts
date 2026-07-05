import type { IComfyAppRepository } from "@/application/ports/IComfyAppRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import type { ComfyApp } from "@/domain/comfyApp/ComfyApp";

/** 列出已保存的应用；未设置软件数据路径或目录不存在时返回空列表（不弹授权对话框） */
export async function listComfyApps(
  pathStore: ISoftwareDataPathStore,
  repository: IComfyAppRepository,
): Promise<ComfyApp[]> {
  const softwareDataPath = pathStore.getPath();
  if (!softwareDataPath) return [];
  try {
    return await repository.list(softwareDataPath);
  } catch {
    return [];
  }
}
