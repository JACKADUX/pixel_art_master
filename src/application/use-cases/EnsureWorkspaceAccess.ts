import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";

export async function probeWorkspaceAccess(path: string): Promise<boolean> {
  try {
    await readDir(path);
    return true;
  } catch {
    return false;
  }
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

export async function ensureWorkspaceAccess(
  workspaceStore: IProjectsWorkspaceStore,
): Promise<string | null> {
  const path = workspaceStore.getPath();
  if (!path) {
    return null;
  }

  if (await probeWorkspaceAccess(path)) {
    return path;
  }

  const selected = await requestWorkspaceAccess(path);
  if (!selected) {
    return null;
  }

  workspaceStore.setPath(selected);
  if (await probeWorkspaceAccess(selected)) {
    return selected;
  }

  return null;
}
