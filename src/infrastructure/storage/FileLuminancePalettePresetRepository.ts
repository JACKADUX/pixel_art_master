import type { ILuminancePalettePresetRepository } from "@/application/ports/ILuminancePalettePresetRepository";
import {
  luminancePaletteFromJSON,
  luminancePaletteToJSON,
  type SerializedLuminancePalette,
} from "@/domain/luminancePalette/LuminancePalette";
import type { LuminancePalettePreset } from "@/domain/luminancePalette/LuminancePalettePreset";
import {
  LUMINANCE_PALETTE_PRESET_LIBRARY_VERSION,
  type LuminancePalettePresetLibrary,
} from "@/domain/luminancePalette/LuminancePalettePresetLibrary";
import { buildLuminancePalettePresetsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedLuminancePalettePreset {
  id: string;
  name: string;
  data: SerializedLuminancePalette;
  createdAt: string;
  updatedAt: string;
}

interface SerializedLuminancePalettePresetLibrary {
  version: number;
  presets: SerializedLuminancePalettePreset[];
}

const SUPPORTED_LIBRARY_VERSIONS = [1] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePreset(value: unknown): LuminancePalettePreset | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : createdAt;
  const data = luminancePaletteFromJSON(
    isRecord(value.data) ? (value.data as unknown as SerializedLuminancePalette) : null,
  );
  return {
    id: value.id,
    name: value.name,
    data: {
      groups: data.groups,
      groupArrangement: data.groupArrangement,
    },
    createdAt,
    updatedAt,
  };
}

function serializeLibrary(
  library: LuminancePalettePresetLibrary,
): SerializedLuminancePalettePresetLibrary {
  return {
    version: LUMINANCE_PALETTE_PRESET_LIBRARY_VERSION,
    presets: library.presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      data: luminancePaletteToJSON({
        groups: preset.data.groups,
        groupArrangement: preset.data.groupArrangement,
        activeGroupId: null,
      }),
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    })),
  };
}

export class FileLuminancePalettePresetRepository implements ILuminancePalettePresetRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    try {
      const parsed = await readUserDataJson(buildLuminancePalettePresetsPath(softwareDataPath));
      if (
        !isRecord(parsed) ||
        !SUPPORTED_LIBRARY_VERSIONS.includes(
          parsed.version as (typeof SUPPORTED_LIBRARY_VERSIONS)[number],
        )
      ) {
        return null;
      }

      const presetsRaw = parsed.presets;
      const presets = Array.isArray(presetsRaw)
        ? presetsRaw.map(parsePreset).filter((preset): preset is LuminancePalettePreset => preset !== null)
        : [];

      const library: LuminancePalettePresetLibrary = {
        version: LUMINANCE_PALETTE_PRESET_LIBRARY_VERSION,
        presets,
      };
      return library;
    } catch {
      return null;
    }
  }

  async save(softwareDataPath: string, library: LuminancePalettePresetLibrary): Promise<void> {
    await writeUserDataJson(
      softwareDataPath,
      buildLuminancePalettePresetsPath(softwareDataPath),
      serializeLibrary(library),
    );
  }
}

export const luminancePalettePresetRepository = new FileLuminancePalettePresetRepository();
