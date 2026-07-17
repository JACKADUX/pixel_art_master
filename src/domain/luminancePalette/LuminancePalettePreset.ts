import type { LuminancePaletteData } from "./LuminancePalette";

export interface LuminancePalettePreset {
  id: string;
  name: string;
  data: Pick<LuminancePaletteData, "groups" | "groupArrangement">;
  createdAt: string;
  updatedAt: string;
}

export function formatLuminancePalettePresetDefaultName(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `明度色板 ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function createLuminancePalettePreset(
  data: Pick<LuminancePaletteData, "groups" | "groupArrangement">,
  name?: string,
): LuminancePalettePreset {
  const now = new Date().toISOString();
  const trimmed = name?.trim();
  return {
    id: crypto.randomUUID(),
    name: trimmed && trimmed.length > 0 ? trimmed : formatLuminancePalettePresetDefaultName(),
    data: {
      groups: data.groups.map((group) => ({
        ...group,
        colors: group.colors.map((swatch) => ({ color: swatch.color, hex: swatch.hex })),
      })),
      groupArrangement: data.groupArrangement,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function renameLuminancePalettePreset(
  preset: LuminancePalettePreset,
  name: string,
): LuminancePalettePreset {
  const trimmed = name.trim();
  if (!trimmed || trimmed === preset.name) return preset;
  return { ...preset, name: trimmed, updatedAt: new Date().toISOString() };
}

export function updateLuminancePalettePresetData(
  preset: LuminancePalettePreset,
  data: Pick<LuminancePaletteData, "groups" | "groupArrangement">,
): LuminancePalettePreset {
  return {
    ...preset,
    data: {
      groups: data.groups.map((group) => ({
        ...group,
        colors: group.colors.map((swatch) => ({ color: swatch.color, hex: swatch.hex })),
      })),
      groupArrangement: data.groupArrangement,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function luminancePalettePresetToSerializableData(
  preset: LuminancePalettePreset,
): Pick<LuminancePaletteData, "groups" | "groupArrangement"> {
  return {
    groups: preset.data.groups.map((group) => ({
      ...group,
      colors: group.colors.map((swatch) => ({ color: swatch.color, hex: swatch.hex })),
    })),
    groupArrangement: preset.data.groupArrangement,
  };
}
