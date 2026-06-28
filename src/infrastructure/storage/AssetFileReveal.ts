import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  buildAssetLibraryRoot,
  joinPath,
} from "@/domain/asset/AssetLibraryPaths";

/**
 * 在系统文件管理器中定位资产文件（打开其所在文件夹并选中该文件）。
 *
 * @param workspacePath 项目工作区绝对路径
 * @param relativeFilePath 资产在资产库根目录下的相对路径
 */
export async function revealAssetFileInFolder(
  workspacePath: string,
  relativeFilePath: string,
): Promise<void> {
  const absolutePath = joinPath(
    buildAssetLibraryRoot(workspacePath),
    relativeFilePath,
  );
  await revealItemInDir(absolutePath);
}
