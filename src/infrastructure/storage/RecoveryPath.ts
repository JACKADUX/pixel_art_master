import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";

const RECOVERY_DIR_NAME = "pixelart-master/autosave";

export async function getRecoveryFilePath(projectId: string): Promise<string> {
  const dir = await join(await appDataDir(), RECOVERY_DIR_NAME);
  await mkdir(dir, { recursive: true });
  return join(dir, `${projectId}.pixelart.json`);
}

export function isRecoveryPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.includes(`${RECOVERY_DIR_NAME}/`);
}
