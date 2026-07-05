export interface CanvasSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  builtin: boolean;
}

export const DEFAULT_CANVAS_SIZE = { width: 64, height: 64 } as const;

export const BUILTIN_CANVAS_SIZE_PRESETS: readonly CanvasSizePreset[] = [
  { id: "16x16", label: "16×16", width: 16, height: 16, builtin: true },
  { id: "32x32", label: "32×32", width: 32, height: 32, builtin: true },
  { id: "48x48", label: "48×48", width: 48, height: 48, builtin: true },
  { id: "64x64", label: "64×64", width: 64, height: 64, builtin: true },
  { id: "128x128", label: "128×128", width: 128, height: 128, builtin: true },
  { id: "256x256", label: "256×256", width: 256, height: 256, builtin: true },
  { id: "32x24", label: "32×24", width: 32, height: 24, builtin: true },
  { id: "48x32", label: "48×32", width: 48, height: 32, builtin: true },
];

export function formatCanvasSizeLabel(width: number, height: number): string {
  return `${width}×${height}`;
}
