import type { IPalettePresetRepository } from "@/application/ports/IPalettePresetRepository";
import { fromHex, toHexAlpha } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { PalettePreset } from "@/domain/palette/PalettePreset";
import {
  PALETTE_PRESET_LIBRARY_VERSION,
  type PalettePresetLibrary,
} from "@/domain/palette/PalettePresetLibrary";
import { buildPalettePresetsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedColorEntry {
  hex: string;
}

interface SerializedPalettePreset {
  id: string;
  name: string;
  colors: SerializedColorEntry[];
  createdAt: string;
  updatedAt: string;
}

interface SerializedPalettePresetLibrary {
  version: number;
  presets: SerializedPalettePreset[];
  defaultPresetId?: string | null;
}

const SUPPORTED_LIBRARY_VERSIONS = [1, 2] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseColorEntries(value: unknown): ColorEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: ColorEntry[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.hex !== "string") continue;
    const hex = item.hex;
    entries.push({ color: fromHex(hex), hex });
  }
  return entries;
}

function parsePreset(value: unknown): PalettePreset | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : createdAt;
  return {
    id: value.id,
    name: value.name,
    colors: parseColorEntries(value.colors),
    createdAt,
    updatedAt,
  };
}

function serializeLibrary(library: PalettePresetLibrary): SerializedPalettePresetLibrary {
  return {
    version: PALETTE_PRESET_LIBRARY_VERSION,
    presets: library.presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      colors: preset.colors.map((c) => ({ hex: c.hex || toHexAlpha(c.color) })),
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    })),
    defaultPresetId: library.defaultPresetId,
  };
}

function parseDefaultPresetId(
  parsed: Record<string, unknown>,
  presets: PalettePreset[],
): string | null {
  const raw = parsed.defaultPresetId;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return presets.some((preset) => preset.id === raw) ? raw : null;
}

export class FilePalettePresetRepository implements IPalettePresetRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    try {
      const parsed = await readUserDataJson(buildPalettePresetsPath(softwareDataPath));
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
        ? presetsRaw.map(parsePreset).filter((p): p is PalettePreset => p !== null)
        : [];

      const library: PalettePresetLibrary = {
        version: PALETTE_PRESET_LIBRARY_VERSION,
        presets,
        defaultPresetId:
          parsed.version === PALETTE_PRESET_LIBRARY_VERSION
            ? parseDefaultPresetId(parsed, presets)
            : null,
      };
      return library;
    } catch {
      return null;
    }
  }

  async save(softwareDataPath: string, library: PalettePresetLibrary): Promise<void> {
    await writeUserDataJson(
      softwareDataPath,
      buildPalettePresetsPath(softwareDataPath),
      serializeLibrary(library),
    );
  }
}

export const palettePresetRepository = new FilePalettePresetRepository();
