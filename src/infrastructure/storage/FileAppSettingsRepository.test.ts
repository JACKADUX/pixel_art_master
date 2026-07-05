import { describe, expect, it, vi, beforeEach } from "vitest";
import { FileAppSettingsRepository } from "@/infrastructure/storage/FileAppSettingsRepository";
import { parseAppSettings } from "@/domain/appSettings/AppSettings";

vi.mock("@tauri-apps/plugin-fs", () => ({
  mkdir: vi.fn(async () => {}),
  readTextFile: vi.fn(async () => JSON.stringify({
    version: 1,
    autoSaveIntervalMinutes: 5,
    pomodoroVisible: false,
    defaultGridPrimary: 32,
    defaultGridSecondary: 16,
    gridColorHex: "#808080",
    gridLineWidth: 1,
    subGridEnabled: true,
    checkerboardTileSize: 8,
    checkerboardLightHex: "#cccccc",
    checkerboardDarkHex: "#999999",
    imageViewerCheckerboardEnabled: true,
    imageViewerSelectionModeEnabled: false,
    symmetryAxisVisible: true,
    symmetryAxisColorHex: "#ff00ff",
    symmetryAxisLineWidth: 1,
    symmetryAxisOutlineEnabled: true,
    defaultCanvasWidth: 64,
    defaultCanvasHeight: 64,
    customCanvasSizePresets: [],
  })),
  writeTextFile: vi.fn(async () => {}),
}));

describe("FileAppSettingsRepository", () => {
  const repository = new FileAppSettingsRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads app settings from software data path", async () => {
    const raw = await repository.load("D:/data");
    expect(parseAppSettings(raw).autoSaveIntervalMinutes).toBe(5);
  });

  it("saves app settings to software data path", async () => {
    const settings = parseAppSettings(null);
    await repository.save("D:/data", settings);
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    expect(writeTextFile).toHaveBeenCalled();
  });
});
