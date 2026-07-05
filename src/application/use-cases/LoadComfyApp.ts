import type {
  ComfyAppRecord,
  IComfyAppRepository,
} from "@/application/ports/IComfyAppRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { ensureSoftwareDataPathAccess } from "./EnsureSoftwareDataPathAccess";

/** 读取单个应用的完整记录（含备份工作流） */
export async function loadComfyApp(
  pathStore: ISoftwareDataPathStore,
  repository: IComfyAppRepository,
  appId: string,
): Promise<ComfyAppRecord | null> {
  const softwareDataPath = await ensureSoftwareDataPathAccess(pathStore);
  if (!softwareDataPath) {
    throw new Error("未设置软件数据路径，请先在设置中选择软件数据路径");
  }
  return repository.load(softwareDataPath, appId);
}
