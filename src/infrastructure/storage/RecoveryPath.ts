import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir, remove } from "@tauri-apps/plugin-fs";

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

export async function cleanupRecoveryFile(projectId: string): Promise<void> {
  try {
    const recoveryPath = await getRecoveryFilePath(projectId);
    await remove(recoveryPath);
  } catch {
    // ignore missing or inaccessible recovery files
  }
}
