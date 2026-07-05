import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ISoftwareDataPathStore } from "../ports/ISoftwareDataPathStore";
import {
  clearSoftwareDataPathAccessCache,
  ensureSoftwareDataPathAccess,
  probeSoftwareDataPathAccess,
} from "./EnsureSoftwareDataPathAccess";

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

function createPathStore(path: string | null): ISoftwareDataPathStore {
  let currentPath = path;
  return {
    getPath: () => currentPath,
    setPath: (nextPath) => {
      currentPath = nextPath;
    },
  };
}

describe("probeSoftwareDataPathAccess", () => {
  beforeEach(() => {
    clearSoftwareDataPathAccessCache();
    vi.mocked(readDir).mockResolvedValue([]);
    vi.mocked(writeTextFile).mockResolvedValue();
    vi.mocked(remove).mockResolvedValue();
  });

  it("returns true only after directory can be read and written", async () => {
    await expect(probeSoftwareDataPathAccess("D:/data")).resolves.toBe(true);

    expect(readDir).toHaveBeenCalledWith("D:/data");
    expect(writeTextFile).toHaveBeenCalledWith("D:/data/pixelart-access-probe.tmp", "ok");
    expect(remove).toHaveBeenCalledWith("D:/data/pixelart-access-probe.tmp");
  });
});

describe("ensureSoftwareDataPathAccess", () => {
  beforeEach(() => {
    clearSoftwareDataPathAccessCache();
    vi.mocked(open).mockResolvedValue(null);
    vi.mocked(readDir).mockResolvedValue([]);
    vi.mocked(writeTextFile).mockResolvedValue();
    vi.mocked(remove).mockResolvedValue();
  });

  it("returns existing software data path when it is accessible", async () => {
    const store = createPathStore("D:/data");

    await expect(ensureSoftwareDataPathAccess(store)).resolves.toBe("D:/data");
  });
});
