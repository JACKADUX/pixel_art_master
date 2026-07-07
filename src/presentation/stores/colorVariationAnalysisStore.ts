import { create } from "zustand";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { analyzeColorVariationFromEntries } from "@/application/use-cases/AnalyzeColorVariation";
import { fromHex, toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import { parseColorListInput } from "@/domain/colorAnalysis/ColorVariationAnalysis";
import type { ColorVariationSeries } from "@/domain/colorAnalysis/ColorVariationAnalysis";
import type { ColorEntry } from "@/domain/palette/Palette";
import { useAppStore } from "./appStore";

export type ColorVariationChannel = "l" | "c" | "h";

interface VisibleChannels {
  l: boolean;
  c: boolean;
  h: boolean;
}

interface ColorVariationAnalysisStore {
  open: boolean;
  colorEntries: ColorEntry[];
  series: ColorVariationSeries | null;
  parseError: string | null;
  visibleChannels: VisibleChannels;

  openPage: () => void;
  closePage: () => void;
  openPageWithColorEntries: (entries: readonly ColorEntry[]) => void;
  setColorEntries: (entries: readonly ColorEntry[]) => void;
  addColor: (color: PixelColor) => void;
  removeColorAt: (index: number) => void;
  updateColorAt: (index: number, color: PixelColor) => void;
  reorderColors: (fromIndex: number, toIndex: number) => void;
  importFromHexFile: () => Promise<void>;
  loadFromCurrentPalette: () => void;
  loadFromColorEntries: (entries: readonly ColorEntry[]) => void;
  toggleChannel: (channel: ColorVariationChannel) => void;
}

const defaultVisibleChannels: VisibleChannels = { l: true, c: true, h: true };

function toColorEntry(color: PixelColor): ColorEntry {
  return { color, hex: toHexAlpha(color) };
}

function deriveStateFromEntries(entries: readonly ColorEntry[]): {
  colorEntries: ColorEntry[];
  series: ColorVariationSeries | null;
  parseError: string | null;
} {
  const colorEntries = [...entries];
  if (colorEntries.length === 0) {
    return { colorEntries, series: null, parseError: null };
  }

  try {
    const series = analyzeColorVariationFromEntries(colorEntries);
    return { colorEntries, series, parseError: null };
  } catch {
    return {
      colorEntries,
      series: null,
      parseError: "颜色解析失败",
    };
  }
}

export const useColorVariationAnalysisStore = create<ColorVariationAnalysisStore>((set, get) => ({
  open: false,
  colorEntries: [],
  series: null,
  parseError: null,
  visibleChannels: defaultVisibleChannels,

  openPage: () => set({ open: true }),

  closePage: () => set({ open: false }),

  openPageWithColorEntries: (entries) => {
    if (entries.length === 0) {
      set({
        open: true,
        parseError: "没有可分析的颜色",
        series: null,
        colorEntries: [],
      });
      return;
    }

    set({ open: true, ...deriveStateFromEntries(entries) });
  },

  setColorEntries: (entries) => {
    set(deriveStateFromEntries(entries));
  },

  addColor: (color) => {
    const next = [...get().colorEntries, toColorEntry(color)];
    set(deriveStateFromEntries(next));
  },

  removeColorAt: (index) => {
    const entries = get().colorEntries;
    if (index < 0 || index >= entries.length) return;
    const next = entries.filter((_, i) => i !== index);
    set(deriveStateFromEntries(next));
  },

  updateColorAt: (index, color) => {
    const entries = get().colorEntries;
    if (index < 0 || index >= entries.length) return;
    const next = entries.map((entry, i) => (i === index ? toColorEntry(color) : entry));
    set(deriveStateFromEntries(next));
  },

  reorderColors: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const entries = get().colorEntries;
    if (
      fromIndex < 0 ||
      fromIndex >= entries.length ||
      toIndex < 0 ||
      toIndex > entries.length
    ) {
      return;
    }

    const next = [...entries];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    set(deriveStateFromEntries(next));
  },

  importFromHexFile: async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Hex 色板", extensions: ["hex", "txt"] }],
    });
    if (!selected || typeof selected !== "string") return;

    try {
      const content = await readTextFile(selected);
      const entries = parseColorListInput(content);
      if (entries.length === 0) {
        set({ parseError: "未在文件中找到有效的十六进制颜色" });
        return;
      }
      get().setColorEntries(entries);
    } catch {
      set({ parseError: "无法读取所选文件" });
    }
  },

  loadFromCurrentPalette: () => {
    const project = useAppStore.getState().project;
    if (!project) {
      set({ parseError: "当前没有打开的项目" });
      return;
    }

    const colors = project.palette.getColors();
    if (colors.length === 0) {
      set({ parseError: "项目色板为空" });
      return;
    }

    get().setColorEntries(colors);
  },

  loadFromColorEntries: (entries) => {
    get().openPageWithColorEntries(entries);
  },

  toggleChannel: (channel) => {
    set((state) => ({
      visibleChannels: {
        ...state.visibleChannels,
        [channel]: !state.visibleChannels[channel],
      },
    }));
  },
}));

export function getDefaultNewVariationColor(entries: readonly ColorEntry[]): PixelColor {
  const last = entries[entries.length - 1];
  return last?.color ?? fromHex("808080");
}
