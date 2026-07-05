import { describe, expect, it } from "vitest";
import {
  buildAppSettingsPath,
  buildPalettePresetsPath,
  buildUserDataRoot,
  USER_DATA_DIR,
} from "./UserDataPaths";

describe("UserDataPaths", () => {
  it("builds user data root under software data path", () => {
    expect(buildUserDataRoot("D:/PixelData")).toBe(`D:/PixelData/${USER_DATA_DIR}`);
  });

  it("builds nested config file paths", () => {
    const root = "C:\\Users\\me\\PixelData";
    expect(buildAppSettingsPath(root)).toBe(
      `C:\\Users\\me\\PixelData\\${USER_DATA_DIR}\\app-settings.json`,
    );
    expect(buildPalettePresetsPath(root)).toBe(
      `C:\\Users\\me\\PixelData\\${USER_DATA_DIR}\\palette-presets.json`,
    );
  });
});
