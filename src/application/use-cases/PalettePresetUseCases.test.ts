import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { toHexAlpha } from "@/domain/canvas/PixelColor";
import {
  addPalettePreset,
  createEmptyPalettePresetLibrary,
  removePalettePreset,
  setDefaultPalettePreset,
} from "@/domain/palette/PalettePresetLibrary";
import {
  createEmptyProjectWithDefaultPalette,
  resolveInitialPaletteFromLibrary,
} from "./PalettePresetUseCases";

const red = { color: rgba(255, 0, 0), hex: toHexAlpha(rgba(255, 0, 0)) };
const green = { color: rgba(0, 255, 0), hex: toHexAlpha(rgba(0, 255, 0)) };

describe("resolveInitialPaletteFromLibrary", () => {
  it("returns empty palette when no default is set", () => {
    const library = createEmptyPalettePresetLibrary();
    const palette = resolveInitialPaletteFromLibrary(library);
    expect(palette.getColors()).toHaveLength(0);
  });

  it("returns default preset colors when default is set", () => {
    const { library, preset } = addPalettePreset(
      createEmptyPalettePresetLibrary(),
      [red, green],
      "test",
    );
    const withDefault = setDefaultPalettePreset(library, preset.id);
    const palette = resolveInitialPaletteFromLibrary(withDefault);
    expect(palette.getColors()).toHaveLength(2);
    expect(palette.getColors().map((c) => c.hex)).toEqual(
      expect.arrayContaining([red.hex, green.hex]),
    );
  });

  it("clears default when default preset is removed", () => {
    const { library, preset } = addPalettePreset(
      createEmptyPalettePresetLibrary(),
      [red],
      "test",
    );
    const withDefault = setDefaultPalettePreset(library, preset.id);
    const afterRemove = removePalettePreset(withDefault, preset.id);
    expect(afterRemove.defaultPresetId).toBeNull();
    expect(resolveInitialPaletteFromLibrary(afterRemove).getColors()).toHaveLength(0);
  });
});

describe("createEmptyProjectWithDefaultPalette", () => {
  it("applies default palette to new project", () => {
    const { library, preset } = addPalettePreset(
      createEmptyPalettePresetLibrary(),
      [red],
      "default",
    );
    const withDefault = setDefaultPalettePreset(library, preset.id);
    const project = createEmptyProjectWithDefaultPalette(withDefault, "blank");
    expect(project.name).toBe("blank");
    expect(project.palette.getColors()).toHaveLength(1);
    expect(project.palette.getColors()[0].hex).toBe(red.hex);
  });
});
