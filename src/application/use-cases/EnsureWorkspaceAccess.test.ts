import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IProjectsWorkspaceStore } from "../ports/IProjectsWorkspaceStore";
import {
  clearWorkspaceAccessCache,
  ensureWorkspaceAccess,
  probeWorkspaceAccess,
} from "./EnsureWorkspaceAccess";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(async () => null),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readDir: vi.fn(async () => []),
  writeTextFile: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
}));

import { open } from "@tauri-apps/plugin-dialog";
import { readDir, remove, writeTextFile } from "@tauri-apps/plugin-fs";

function createWorkspaceStore(path: string | null): IProjectsWorkspaceStore {
  let currentPath = path;
  return {
    getPath: () => currentPath,
    setPath: (nextPath) => {
      currentPath = nextPath;
    },
  };
}

describe("probeWorkspaceAccess", () => {
  beforeEach(() => {
    clearWorkspaceAccessCache();
    vi.mocked(readDir).mockResolvedValue([]);
    vi.mocked(writeTextFile).mockResolvedValue();
    vi.mocked(remove).mockResolvedValue();
  });

  it("returns true only after directory can be read and written", async () => {
    await expect(probeWorkspaceAccess("D:/workspace")).resolves.toBe(true);

    expect(readDir).toHaveBeenCalledWith("D:/workspace");
    expect(writeTextFile).toHaveBeenCalledWith("D:/workspace/pixelart-access-probe.tmp", "ok");
    expect(remove).toHaveBeenCalledWith("D:/workspace/pixelart-access-probe.tmp");
  });

  it("returns true when write succeeds but cleanup fails", async () => {
    vi.mocked(remove).mockRejectedValueOnce(new Error("cleanup failed"));

    await expect(probeWorkspaceAccess("D:/workspace")).resolves.toBe(true);
  });

  it("returns false when write probe fails", async () => {
    vi.mocked(writeTextFile).mockRejectedValueOnce(new Error("denied"));

    await expect(probeWorkspaceAccess("D:/workspace")).resolves.toBe(false);
  });

  it("uses session cache on subsequent checks", async () => {
    await expect(probeWorkspaceAccess("D:/workspace")).resolves.toBe(true);
    vi.mocked(readDir).mockClear();
    vi.mocked(writeTextFile).mockClear();
    vi.mocked(remove).mockClear();

    await expect(probeWorkspaceAccess("D:/workspace")).resolves.toBe(true);

    expect(readDir).not.toHaveBeenCalled();
    expect(writeTextFile).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("ensureWorkspaceAccess", () => {
  beforeEach(() => {
    clearWorkspaceAccessCache();
    vi.mocked(open).mockResolvedValue(null);
    vi.mocked(readDir).mockResolvedValue([]);
    vi.mocked(writeTextFile).mockResolvedValue();
    vi.mocked(remove).mockResolvedValue();
  });

  it("returns existing workspace path when it is accessible", async () => {
    const store = createWorkspaceStore("D:/workspace");

    await expect(ensureWorkspaceAccess(store)).resolves.toBe("D:/workspace");
  });

  it("requests and stores a new path when current workspace is inaccessible", async () => {
    vi.mocked(readDir).mockRejectedValueOnce(new Error("denied"));
    vi.mocked(open).mockResolvedValueOnce("E:/authorized");
    const store = createWorkspaceStore("D:/workspace");

    await expect(ensureWorkspaceAccess(store)).resolves.toBe("E:/authorized");
    expect(store.getPath()).toBe("E:/authorized");
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("returns null when authorization is cancelled", async () => {
    vi.mocked(readDir).mockRejectedValueOnce(new Error("denied"));
    vi.mocked(open).mockResolvedValueOnce(null);
    const store = createWorkspaceStore("D:/workspace");

    await expect(ensureWorkspaceAccess(store)).resolves.toBeNull();
  });

  it("does not reopen authorization after user grants access once", async () => {
    vi.mocked(readDir).mockImplementation(async (path) => {
      const dir = typeof path === "string" ? path : path.toString();
      if (dir.replace(/\\/g, "/").toLowerCase() === "d:/workspace") {
        throw new Error("denied");
      }
      return [];
    });
    vi.mocked(writeTextFile).mockRejectedValue(new Error("denied"));
    vi.mocked(open).mockResolvedValueOnce("E:/authorized");
    const store = createWorkspaceStore("D:/workspace");

    await expect(ensureWorkspaceAccess(store)).resolves.toBe("E:/authorized");
    vi.mocked(open).mockClear();
    await expect(ensureWorkspaceAccess(store)).resolves.toBe("E:/authorized");

    expect(open).not.toHaveBeenCalled();
  });
});
