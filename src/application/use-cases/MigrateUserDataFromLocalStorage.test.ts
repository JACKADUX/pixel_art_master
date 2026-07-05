import { describe, expect, it, vi, beforeEach } from "vitest";
import { USER_DATA_MIGRATION_ENTRIES } from "@/infrastructure/storage/UserDataMigrationKeys";
import { migrateUserDataFromLocalStorage } from "./MigrateUserDataFromLocalStorage";

const storage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
});

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(async () => false),
  mkdir: vi.fn(async () => {}),
  writeTextFile: vi.fn(async () => {}),
}));

import { exists, writeTextFile } from "@tauri-apps/plugin-fs";

describe("migrateUserDataFromLocalStorage", () => {
  beforeEach(() => {
    storage.clear();
    vi.mocked(exists).mockImplementation(async (path) => {
      const value = String(path);
      return value.endsWith("migration-manifest.json");
    });
  });

  it("skips migration when manifest already exists", async () => {
    storage.set("pixelart-palette-presets", JSON.stringify({ version: 2, presets: [] }));

    await migrateUserDataFromLocalStorage("D:/data");

    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it("migrates localStorage entries to files", async () => {
    vi.mocked(exists).mockResolvedValue(false);
    storage.set(
      "pixelart-palette-presets",
      JSON.stringify({ version: 2, presets: [], defaultPresetId: null }),
    );

    await migrateUserDataFromLocalStorage("D:/data");

    expect(writeTextFile).toHaveBeenCalled();
    expect(storage.get("pixelart-palette-presets")).toBeUndefined();
  });

  it("covers all configured migration keys", () => {
    expect(USER_DATA_MIGRATION_ENTRIES.length).toBeGreaterThan(10);
  });
});
