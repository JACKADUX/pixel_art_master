import type { IPalettePresetRepository } from "@/application/ports/IPalettePresetRepository";
import { fromHex, toHexAlpha } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { PalettePreset } from "@/domain/palette/PalettePreset";
import {
  PALETTE_PRESET_LIBRARY_VERSION,
  type PalettePresetLibrary,
} from "@/domain/palette/PalettePresetLibrary";

const STORAGE_KEY = "pixelart-palette-presets";

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
}

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
  };
}

export class LocalPalettePresetRepository implements IPalettePresetRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (!isRecord(parsed) || parsed.version !== PALETTE_PRESET_LIBRARY_VERSION) {
        return null;
      }

      const presetsRaw = parsed.presets;
      const presets = Array.isArray(presetsRaw)
        ? presetsRaw.map(parsePreset).filter((p): p is PalettePreset => p !== null)
        : [];

      const library: PalettePresetLibrary = {
        version: PALETTE_PRESET_LIBRARY_VERSION,
        presets,
      };
      return library;
    } catch {
      return null;
    }
  }

  save(library: PalettePresetLibrary): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeLibrary(library)));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const palettePresetRepository = new LocalPalettePresetRepository();
