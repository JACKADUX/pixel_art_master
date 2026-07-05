import { open } from "@tauri-apps/plugin-dialog";
import { readDir, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";

const ACCESS_PROBE_FILE = "pixelart-access-probe.tmp";

const verifiedPaths = new Set<string>();
let pendingAccess: Promise<string | null> | null = null;

export function normalizeSoftwareDataAccessPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

export function markSoftwareDataPathAccessGranted(path: string): void {
  verifiedPaths.add(normalizeSoftwareDataAccessPath(path));
}

/** 仅用于测试：重置会话内的软件数据路径授权缓存。 */
export function clearSoftwareDataPathAccessCache(): void {
  verifiedPaths.clear();
  pendingAccess = null;
}

function buildAccessProbePath(path: string): string {
  const separator = path.includes("\\") ? "\\" : "/";
  const normalized = path.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${ACCESS_PROBE_FILE}`;
}

async function probeSoftwareDataPathWriteAccess(path: string): Promise<boolean> {
  try {
    const probePath = buildAccessProbePath(path);
    await writeTextFile(probePath, "ok");
    try {
      await remove(probePath);
    } catch {
      // 写入已成功即可证明可写；清理失败不应触发重复授权。
    }
    return true;
  } catch {
    return false;
  }
}

export async function probeSoftwareDataPathAccess(path: string): Promise<boolean> {
  const key = normalizeSoftwareDataAccessPath(path);
  if (verifiedPaths.has(key)) {
    return true;
  }

  try {
    await readDir(path);
  } catch {
    return false;
  }

  const canWrite = await probeSoftwareDataPathWriteAccess(path);
  if (canWrite) {
    verifiedPaths.add(key);
  }
  return canWrite;
}

export async function requestSoftwareDataPathAccess(currentPath: string): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    recursive: true,
    defaultPath: currentPath,
    title: "授权软件数据路径访问",
  });
  if (!selected || typeof selected !== "string") {
    return null;
  }
  return selected;
}

async function ensureSoftwareDataPathAccessInternal(
  pathStore: ISoftwareDataPathStore,
): Promise<string | null> {
  const path = pathStore.getPath();
  if (!path) {
    return null;
  }

  const key = normalizeSoftwareDataAccessPath(path);
  if (verifiedPaths.has(key)) {
    return path;
  }

  if (await probeSoftwareDataPathAccess(path)) {
    return path;
  }

  const selected = await requestSoftwareDataPathAccess(path);
  if (!selected) {
    return null;
  }

  pathStore.setPath(selected);
  markSoftwareDataPathAccessGranted(selected);

  try {
    await readDir(selected);
    return selected;
  } catch {
    return null;
  }
}

export async function ensureSoftwareDataPathAccess(
  pathStore: ISoftwareDataPathStore,
): Promise<string | null> {
  if (pendingAccess) {
    return pendingAccess;
  }

  pendingAccess = ensureSoftwareDataPathAccessInternal(pathStore).finally(() => {
    pendingAccess = null;
  });
  return pendingAccess;
}
