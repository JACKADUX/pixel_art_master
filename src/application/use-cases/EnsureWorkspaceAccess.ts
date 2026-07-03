import { open } from "@tauri-apps/plugin-dialog";
import { readDir, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";

const ACCESS_PROBE_FILE = "pixelart-access-probe.tmp";

const verifiedPaths = new Set<string>();
let pendingAccess: Promise<string | null> | null = null;

export function normalizeWorkspaceAccessPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

export function markWorkspaceAccessGranted(path: string): void {
  verifiedPaths.add(normalizeWorkspaceAccessPath(path));
}

/** 仅用于测试：重置会话内的工作区授权缓存。 */
export function clearWorkspaceAccessCache(): void {
  verifiedPaths.clear();
  pendingAccess = null;
}

function buildAccessProbePath(path: string): string {
  const separator = path.includes("\\") ? "\\" : "/";
  const normalized = path.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${ACCESS_PROBE_FILE}`;
}

async function probeWorkspaceWriteAccess(path: string): Promise<boolean> {
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

export async function probeWorkspaceAccess(path: string): Promise<boolean> {
  const key = normalizeWorkspaceAccessPath(path);
  if (verifiedPaths.has(key)) {
    return true;
  }

  try {
    await readDir(path);
  } catch {
    return false;
  }

  const canWrite = await probeWorkspaceWriteAccess(path);
  if (canWrite) {
    verifiedPaths.add(key);
  }
  return canWrite;
}

export async function requestWorkspaceAccess(currentPath: string): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    recursive: true,
    defaultPath: currentPath,
    title: "授权项目目录访问",
  });
  if (!selected || typeof selected !== "string") {
    return null;
  }
  return selected;
}

async function ensureWorkspaceAccessInternal(
  workspaceStore: IProjectsWorkspaceStore,
): Promise<string | null> {
  const path = workspaceStore.getPath();
  if (!path) {
    return null;
  }

  const key = normalizeWorkspaceAccessPath(path);
  if (verifiedPaths.has(key)) {
    return path;
  }

  if (await probeWorkspaceAccess(path)) {
    return path;
  }

  const selected = await requestWorkspaceAccess(path);
  if (!selected) {
    return null;
  }

  workspaceStore.setPath(selected);
  markWorkspaceAccessGranted(selected);

  try {
    await readDir(selected);
    return selected;
  } catch {
    return null;
  }
}

export async function ensureWorkspaceAccess(
  workspaceStore: IProjectsWorkspaceStore,
): Promise<string | null> {
  if (pendingAccess) {
    return pendingAccess;
  }

  pendingAccess = ensureWorkspaceAccessInternal(workspaceStore).finally(() => {
    pendingAccess = null;
  });
  return pendingAccess;
}
