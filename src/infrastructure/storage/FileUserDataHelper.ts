import { buildUserDataRoot } from "@/domain/softwareDataPath/UserDataPaths";
import { exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export async function ensureUserDataDir(softwareDataPath: string): Promise<void> {
  await mkdir(buildUserDataRoot(softwareDataPath), { recursive: true });
}

export async function userDataFileExists(filePath: string): Promise<boolean> {
  try {
    return await exists(filePath);
  } catch {
    return false;
  }
}

export async function readUserDataJson(filePath: string): Promise<unknown | null> {
  try {
    const json = await readTextFile(filePath);
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

export async function writeUserDataJson(
  softwareDataPath: string,
  filePath: string,
  data: unknown,
): Promise<void> {
  await ensureUserDataDir(softwareDataPath);
  await writeTextFile(filePath, JSON.stringify(data, null, 2));
}
