import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMAGE_EXPORT_PREFERENCES,
  parseImageExportPreferences,
} from "./ImageExportPreferences";

describe("ImageExportPreferences", () => {
  it("returns defaults for invalid input", () => {
    expect(parseImageExportPreferences(null)).toEqual(DEFAULT_IMAGE_EXPORT_PREFERENCES);
  });

  it("parses stored preferences", () => {
    expect(
      parseImageExportPreferences({
        lastExportDirectory: "C:\\exports",
        format: "webp",
        scope: "layer",
        scalePreset: "512",
        customLongestEdge: 300,
      }),
    ).toEqual({
      lastExportDirectory: "C:\\exports",
      format: "webp",
      scope: "layer",
      scalePreset: "512",
      customLongestEdge: 300,
    });
  });

  it("clamps custom longest edge", () => {
    expect(
      parseImageExportPreferences({ customLongestEdge: 99999 }).customLongestEdge,
    ).toBe(8192);
  });
});
