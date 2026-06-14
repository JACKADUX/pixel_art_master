import { create } from "zustand";
import type { CapturableMonitor } from "@/application/ports/ICaptureService";
import { applyColorMergeEdit } from "@/application/use-cases/ColorEditUseCases";
import { loadColorEditPreferences } from "@/application/use-cases/LoadColorEditPreferences";
import { saveColorEditPreferences } from "@/application/use-cases/SaveColorEditPreferences";
import {
  captureMonitorToImagePath,
  loadSourceImageFromClipboard,
  loadSourceImageFromFile,
  loadSourceImageFromPath,
} from "@/application/use-cases/PixelRestoreUseCases";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import { getAlpha, rgba } from "@/domain/canvas/PixelColor";
import type { ColorEditMode } from "@/domain/colorEdit/ColorEditMode";
import {
  DEFAULT_COLOR_EDIT_PREFERENCES,
  extractColorEditPreferences,
} from "@/domain/colorEdit/ColorEditPreferences";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import {
  anchorColorKey,
  clampAnchorDistance,
  createColorMergeAnchor,
  type ColorMergeAnchor,
} from "@/domain/colorEdit/ColorMergeAnchor";
import { reorderAnchors } from "@/domain/colorEdit/ColorMergeOperations";
import { computeColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import type { UnmatchedPixelBehavior } from "@/domain/colorEdit/UnmatchedPixelBehavior";
import { clipboardService } from "@/infrastructure/clipboard/createClipboardService";
import { imageProcessor } from "@/infrastructure/image/CanvasImageProcessor";
import { colorEditPreferencesRepository } from "@/infrastructure/storage/LocalColorEditPreferencesRepository";
import { captureService } from "@/infrastructure/tauri/TauriCaptureService";

interface ColorEditStore {
  open: boolean;
  sourceImageData: ImageData | null;
  resultImageData: ImageData | null;
  statsBefore: ColorPaletteStats | null;
  statsAfter: ColorPaletteStats | null;
  loading: boolean;
  error: string | null;
  monitorPickerOpen: boolean;
  availableMonitors: CapturableMonitor[];
  editMode: ColorEditMode;
  defaultAnchorDistance: number;
  unmatchedPixelBehavior: UnmatchedPixelBehavior;
  mergeAnchors: ColorMergeAnchor[];
  pickColorMode: boolean;

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  importFromPath: (path: string) => Promise<void>;
  importFromFile: (file: File) => Promise<void>;
  importFromImageData: (imageData: ImageData) => void;
  importFromClipboard: () => Promise<void>;
  screenCapture: () => Promise<void>;
  captureFromMonitor: (monitorId: number) => Promise<void>;
  closeMonitorPicker: () => void;
  setEditMode: (mode: ColorEditMode) => void;
  setDefaultAnchorDistance: (distance: number) => void;
  setUnmatchedPixelBehavior: (behavior: UnmatchedPixelBehavior) => void;
  addMergeAnchor: (color: PixelColor) => void;
  removeMergeAnchor: (id: string) => void;
  setAnchorDistance: (id: string, distance: number) => void;
  reorderMergeAnchors: (fromIndex: number, toIndex: number) => void;
  togglePickColorMode: () => void;
  pickColorFromSource: (color: PixelColor) => void;
  reprocess: () => void;
}

const loadedPreferences =
  loadColorEditPreferences(colorEditPreferencesRepository) ?? DEFAULT_COLOR_EDIT_PREFERENCES;

const sessionDefaults = {
  open: false,
  sourceImageData: null as ImageData | null,
  resultImageData: null as ImageData | null,
  statsBefore: null as ColorPaletteStats | null,
  statsAfter: null as ColorPaletteStats | null,
  loading: false,
  error: null as string | null,
  monitorPickerOpen: false,
  availableMonitors: [] as CapturableMonitor[],
  mergeAnchors: [] as ColorMergeAnchor[],
  pickColorMode: false,
};

const initialState = {
  ...sessionDefaults,
  editMode: loadedPreferences.editMode,
  defaultAnchorDistance: loadedPreferences.defaultAnchorDistance,
  unmatchedPixelBehavior: loadedPreferences.unmatchedPixelBehavior,
};

let isHydratingPreferences = true;
let preferencesSaveTimer: ReturnType<typeof setTimeout> | null = null;

isHydratingPreferences = false;

function reprocessColorEdit(
  sourceImageData: ImageData,
  mergeAnchors: ColorMergeAnchor[],
  unmatchedPixelBehavior: UnmatchedPixelBehavior,
) {
  try {
    const result = applyColorMergeEdit(sourceImageData, mergeAnchors, {
      unmatchedPixelBehavior,
    });
    return {
      resultImageData: result.resultImageData,
      statsBefore: result.statsBefore,
      statsAfter: result.statsAfter,
      error: null as string | null,
    };
  } catch (err) {
    return {
      resultImageData: null,
      statsBefore: computeColorPaletteStats(sourceImageData),
      statsAfter: null,
      error: err instanceof Error ? err.message : "处理失败",
    };
  }
}

function applySourceImage(
  sourceImageData: ImageData,
  unmatchedPixelBehavior: UnmatchedPixelBehavior,
) {
  return {
    sourceImageData,
    mergeAnchors: [] as ColorMergeAnchor[],
    pickColorMode: false,
    ...reprocessColorEdit(sourceImageData, [], unmatchedPixelBehavior),
  };
}

function pickPreferenceFields(state: ColorEditStore) {
  return extractColorEditPreferences({
    editMode: state.editMode,
    defaultAnchorDistance: state.defaultAnchorDistance,
    unmatchedPixelBehavior: state.unmatchedPixelBehavior,
  });
}

function withReprocess(state: ColorEditStore, patch: Partial<ColorEditStore>) {
  const next = { ...state, ...patch };
  if (!next.sourceImageData) return patch;
  return {
    ...patch,
    ...reprocessColorEdit(
      next.sourceImageData,
      next.mergeAnchors,
      next.unmatchedPixelBehavior,
    ),
  };
}

export const useColorEditStore = create<ColorEditStore>((set, get) => ({
  ...initialState,

  openPage: () => set({ open: true }),

  closePage: () => set({ open: false, monitorPickerOpen: false, pickColorMode: false }),

  reset: () => {
    const prefs = pickPreferenceFields(get());
    set({
      ...sessionDefaults,
      open: get().open,
      ...prefs,
    });
  },

  importFromImageData: (imageData) => {
    set({
      ...applySourceImage(imageData, get().unmatchedPixelBehavior),
      loading: false,
      error: null,
    });
  },

  importFromPath: async (path) => {
    set({ loading: true, error: null });
    try {
      const sourceImageData = await loadSourceImageFromPath(imageProcessor, path);
      set({
        ...applySourceImage(sourceImageData, get().unmatchedPixelBehavior),
        loading: false,
      });
    } catch {
      set({
        loading: false,
        error: "导入图片失败，请重试",
      });
    }
  },

  importFromFile: async (file) => {
    set({ loading: true, error: null });
    try {
      const sourceImageData = await loadSourceImageFromFile(imageProcessor, file);
      set({
        ...applySourceImage(sourceImageData, get().unmatchedPixelBehavior),
        loading: false,
      });
    } catch {
      set({
        loading: false,
        error: "导入图片失败，请重试",
      });
    }
  },

  importFromClipboard: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const sourceImageData = await loadSourceImageFromClipboard(clipboardService);
      set({
        ...applySourceImage(sourceImageData, get().unmatchedPixelBehavior),
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "粘贴失败，请重试",
      });
    }
  },

  screenCapture: async () => {
    if (get().loading) return;
    try {
      const monitors = await captureService.listMonitors();
      if (monitors.length === 0) {
        set({ error: "未找到可用显示器" });
        return;
      }
      if (monitors.length === 1) {
        await get().captureFromMonitor(monitors[0].id);
        return;
      }
      set({ availableMonitors: monitors, monitorPickerOpen: true, error: null });
    } catch {
      set({ error: "获取显示器列表失败" });
    }
  },

  captureFromMonitor: async (monitorId) => {
    set({ loading: true, error: null, monitorPickerOpen: false });
    try {
      const path = await captureMonitorToImagePath(captureService, monitorId);
      const sourceImageData = await loadSourceImageFromPath(imageProcessor, path);
      set({
        ...applySourceImage(sourceImageData, get().unmatchedPixelBehavior),
        loading: false,
      });
    } catch {
      set({
        loading: false,
        error: "截图失败，请重试",
      });
    }
  },

  closeMonitorPicker: () => set({ monitorPickerOpen: false }),

  setEditMode: (mode) => set({ editMode: mode }),

  setDefaultAnchorDistance: (distance) => {
    set({ defaultAnchorDistance: clampAnchorDistance(distance) });
  },

  setUnmatchedPixelBehavior: (behavior) => {
    set(withReprocess(get(), { unmatchedPixelBehavior: behavior }));
  },

  addMergeAnchor: (color) => {
    if (getAlpha(color) === 0) return;
    const key = anchorColorKey(color);
    if (get().mergeAnchors.some((anchor) => anchorColorKey(anchor.color) === key)) return;
    const mergeAnchors = [
      ...get().mergeAnchors,
      createColorMergeAnchor(color, get().defaultAnchorDistance),
    ];
    set(withReprocess(get(), { mergeAnchors }));
  },

  removeMergeAnchor: (id) => {
    const mergeAnchors = get().mergeAnchors.filter((anchor) => anchor.id !== id);
    set(withReprocess(get(), { mergeAnchors }));
  },

  setAnchorDistance: (id, distance) => {
    const mergeAnchors = get().mergeAnchors.map((anchor) =>
      anchor.id === id ? { ...anchor, distance: clampAnchorDistance(distance) } : anchor,
    );
    set(withReprocess(get(), { mergeAnchors }));
  },

  reorderMergeAnchors: (fromIndex, toIndex) => {
    const mergeAnchors = reorderAnchors(get().mergeAnchors, fromIndex, toIndex);
    set(withReprocess(get(), { mergeAnchors }));
  },

  togglePickColorMode: () => set({ pickColorMode: !get().pickColorMode }),

  pickColorFromSource: (color) => {
    get().addMergeAnchor(color);
  },

  reprocess: () => {
    const { sourceImageData, mergeAnchors, unmatchedPixelBehavior } = get();
    if (!sourceImageData) return;
    set(reprocessColorEdit(sourceImageData, mergeAnchors, unmatchedPixelBehavior));
  },
}));

useColorEditStore.subscribe((state, prev) => {
  if (isHydratingPreferences) return;

  if (
    state.editMode === prev.editMode &&
    state.defaultAnchorDistance === prev.defaultAnchorDistance &&
    state.unmatchedPixelBehavior === prev.unmatchedPixelBehavior
  ) {
    return;
  }

  if (preferencesSaveTimer) {
    clearTimeout(preferencesSaveTimer);
  }

  preferencesSaveTimer = setTimeout(() => {
    saveColorEditPreferences(
      colorEditPreferencesRepository,
      extractColorEditPreferences(state),
    );
    preferencesSaveTimer = null;
  }, 300);
});

export function sampleSourcePixel(x: number, y: number): PixelColor | null {
  const sourceImageData = useColorEditStore.getState().sourceImageData;
  if (!sourceImageData) return null;
  if (x < 0 || y < 0 || x >= sourceImageData.width || y >= sourceImageData.height) return null;
  const offset = (y * sourceImageData.width + x) * 4;
  const { data } = sourceImageData;
  return rgba(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
}
