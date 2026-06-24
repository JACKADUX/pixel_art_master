import type { ColorEntry } from "./Palette";

export interface PalettePreset {
  id: string;
  name: string;
  colors: ColorEntry[];
  createdAt: string;
  updatedAt: string;
}

export function formatPalettePresetDefaultName(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `色板 ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function createPalettePreset(
  colors: readonly ColorEntry[],
  name?: string,
): PalettePreset {
  const now = new Date().toISOString();
  const trimmed = name?.trim();
  return {
    id: crypto.randomUUID(),
    name: trimmed && trimmed.length > 0 ? trimmed : formatPalettePresetDefaultName(),
    colors: colors.map((c) => ({ color: c.color, hex: c.hex })),
    createdAt: now,
    updatedAt: now,
  };
}

export function renamePalettePreset(preset: PalettePreset, name: string): PalettePreset {
  const trimmed = name.trim();
  if (!trimmed || trimmed === preset.name) return preset;
  return { ...preset, name: trimmed, updatedAt: new Date().toISOString() };
}

export function updatePalettePresetColors(
  preset: PalettePreset,
  colors: readonly ColorEntry[],
): PalettePreset {
  return {
    ...preset,
    colors: colors.map((c) => ({ color: c.color, hex: c.hex })),
    updatedAt: new Date().toISOString(),
  };
}
