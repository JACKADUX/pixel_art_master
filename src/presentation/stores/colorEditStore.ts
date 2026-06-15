import { create } from "zustand";
import type { CapturableMonitor } from "@/application/ports/ICaptureService";
import { applyOklabMergeEdit } from "@/application/use-cases/ColorEditUseCases";
import { loadColorEditPreferences } from "@/application/use-cases/LoadColorEditPreferences";
import { saveColorEditPreferences } from "@/application/use-cases/SaveColorEditPreferences";
import {
  captureMonitorToImagePath,
  loadSourceImageFromClipboard,
  loadSourceImageFromFile,
  loadSourceImageFromPath,
} from "@/application/use-cases/PixelRestoreUseCases";
import {
  DEFAULT_COLOR_EDIT_PREFERENCES,
  extractColorEditPreferences,
} from "@/domain/colorEdit/ColorEditPreferences";
import { clampOklabMergeThreshold } from "@/domain/colorEdit/OklabMergeDistance";
import { filterDisabledColorsInPalette } from "@/domain/colorEdit/ColorDisableOperations";
import {
  createManualMergeAnchor,
  type ManualMergeAnchor,
} from "@/domain/colorEdit/ManualMergeAnchor";
import type { OklabReduceAlgorithm } from "@/domain/colorEdit/OklabReduceAlgorithm";
import type { ColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import { computeColorPaletteStats } from "@/domain/colorEdit/ColorPaletteStats";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import { clipboardService } from "@/infrastructure/clipboard/createClipboardService";
import { imageProcessor } from "@/infrastructure/image/CanvasImageProcessor";
import { colorEditPreferencesRepository } from "@/infrastructure/storage/LocalColorEditPreferencesRepository";
import { captureService } from "@/infrastructure/tauri/TauriCaptureService";
import { cancelActiveColorEditJob } from "@/infrastructure/colorEdit/cancelColorEditJob";

interface ColorEditStore {
  open: boolean;
  sourceImageData: ImageData | null;
  resultImageData: ImageData | null;
  statsBefore: ColorPaletteStats | null;
  statsAfterNormalized: ColorPaletteStats | null;
  statsAfter: ColorPaletteStats | null;
  mergeGroupCount: number | null;
  loading: boolean;
  processing: boolean;
  error: string | null;
  monitorPickerOpen: boolean;
  availableMonitors: CapturableMonitor[];
  oklabMergeThreshold: number;
  oklabReduceAlgorithm: OklabReduceAlgorithm;
  manualMergeAnchors: ManualMergeAnchor[];
  disabledColors: PixelColor[];
  sourcePickMode: boolean;

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
  setOklabMergeThreshold: (threshold: number) => void;
  setOklabReduceAlgorithm: (algorithm: OklabReduceAlgorithm) => void;
  setSourcePickMode: (enabled: boolean) => void;
  addManualMergeAnchor: (color: PixelColor) => void;
  removeManualMergeAnchor: (id: string) => void;
  setManualMergeAnchorThreshold: (id: string, threshold: number) => void;
  toggleNormalizedColorDisabled: (color: PixelColor) => void;
  cancelProcessing: () => void;
  reprocess: () => void;
}

const loadedPreferences =
  loadColorEditPreferences(colorEditPreferencesRepository) ?? DEFAULT_COLOR_EDIT_PREFERENCES;

const sessionDefaults = {
  open: false,
  sourceImageData: null as ImageData | null,
  resultImageData: null as ImageData | null,
  statsBefore: null as ColorPaletteStats | null,
  statsAfterNormalized: null as ColorPaletteStats | null,
  statsAfter: null as ColorPaletteStats | null,
  mergeGroupCount: null as number | null,
  loading: false,
  processing: false,
  error: null as string | null,
  monitorPickerOpen: false,
  availableMonitors: [] as CapturableMonitor[],
  manualMergeAnchors: [] as ManualMergeAnchor[],
  disabledColors: [] as PixelColor[],
  sourcePickMode: false,
};

const initialState = {
  ...sessionDefaults,
  oklabMergeThreshold: loadedPreferences.oklabMergeThreshold,
  oklabReduceAlgorithm: loadedPreferences.oklabReduceAlgorithm,
};

let isHydratingPreferences = true;
let preferencesSaveTimer: ReturnType<typeof setTimeout> | null = null;
let reprocessGeneration = 0;
let reprocessDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let reprocessInFlight = false;
let reprocessQueued = false;
let lastHandledGeneration = 0;
let activeReprocessJobId = 0;

isHydratingPreferences = false;

interface ReprocessInput {
  sourceImageData: ImageData;
  oklabMergeThreshold: number;
  oklabReduceAlgorithm: OklabReduceAlgorithm;
  manualMergeAnchors: ManualMergeAnchor[];
  disabledColors: PixelColor[];
  jobId: number;
}

async function reprocessColorEdit(state: ReprocessInput) {
  try {
    const result = await applyOklabMergeEdit(
      state.sourceImageData,
      {
        threshold: state.oklabMergeThreshold,
        reduceAlgorithm: state.oklabReduceAlgorithm,
      },
      state.manualMergeAnchors,
      state.disabledColors,
      state.jobId,
    );
    const activeDisabledColors = filterDisabledColorsInPalette(
      result.statsAfterNormalized,
      state.disabledColors,
    );
    return {
      resultImageData: result.resultImageData,
      statsBefore: result.statsBefore,
      statsAfterNormalized: result.statsAfterNormalized,
      statsAfter: result.statsAfter,
      mergeGroupCount: result.mergeGroupCount,
      disabledColors: activeDisabledColors,
      error: null as string | null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "处理失败";
    if (message === "处理已中断") {
      return {
        cancelled: true as const,
      };
    }
    return {
      cancelled: false as const,
      resultImageData: null,
      statsBefore: computeColorPaletteStats(state.sourceImageData),
      statsAfterNormalized: null,
      statsAfter: null,
      mergeGroupCount: null,
      error: message,
    };
  }
}

function scheduleReprocess(
  get: () => ColorEditStore,
  set: (partial: Partial<ColorEditStore>) => void,
  patch: Partial<ColorEditStore>,
  options?: { immediate?: boolean },
) {
  const next = { ...get(), ...patch };
  if (!next.sourceImageData) {
    set(patch);
    return;
  }

  reprocessGeneration += 1;
  set({ ...patch, processing: true, error: null });

  if (reprocessDebounceTimer) {
    clearTimeout(reprocessDebounceTimer);
  }

  const delay = options?.immediate ? 0 : 150;
  reprocessDebounceTimer = setTimeout(() => {
    reprocessDebounceTimer = null;
    void runLatestReprocess(get, set);
  }, delay);
}

async function runLatestReprocess(
  get: () => ColorEditStore,
  set: (partial: Partial<ColorEditStore>) => void,
) {
  if (reprocessInFlight) {
    reprocessQueued = true;
    return;
  }

  reprocessInFlight = true;
  try {
    while (reprocessGeneration !== lastHandledGeneration) {
      const generation = reprocessGeneration;
      activeReprocessJobId = generation;
      const current = get();
      if (!current.sourceImageData) {
        lastHandledGeneration = generation;
        break;
      }

      const result = await reprocessColorEdit({
        sourceImageData: current.sourceImageData,
        oklabMergeThreshold: current.oklabMergeThreshold,
        oklabReduceAlgorithm: current.oklabReduceAlgorithm,
        manualMergeAnchors: current.manualMergeAnchors,
        disabledColors: current.disabledColors,
        jobId: generation,
      });

      if (generation !== reprocessGeneration) {
        continue;
      }

      if ("cancelled" in result && result.cancelled) {
        lastHandledGeneration = generation;
        break;
      }

      set({ ...result, processing: false });
      lastHandledGeneration = generation;
    }
  } finally {
    reprocessInFlight = false;
    const hasPending = reprocessQueued || reprocessGeneration !== lastHandledGeneration;
    reprocessQueued = false;
    if (hasPending) {
      set({ processing: true });
      void runLatestReprocess(get, set);
      return;
    }
    set({ processing: false });
  }
}

function pickPreferenceFields(state: ColorEditStore) {
  return extractColorEditPreferences({
    oklabMergeThreshold: state.oklabMergeThreshold,
    oklabReduceAlgorithm: state.oklabReduceAlgorithm,
  });
}

export const useColorEditStore = create<ColorEditStore>((set, get) => ({
  ...initialState,

  openPage: () => set({ open: true }),

  closePage: () => set({ open: false, monitorPickerOpen: false }),

  reset: () => {
    reprocessGeneration += 1;
    lastHandledGeneration = reprocessGeneration;
    if (reprocessDebounceTimer) {
      clearTimeout(reprocessDebounceTimer);
      reprocessDebounceTimer = null;
    }
    const prefs = pickPreferenceFields(get());
    set({
      ...sessionDefaults,
      open: get().open,
      ...prefs,
    });
  },

  importFromImageData: (imageData) => {
    scheduleReprocess(
      get,
      set,
      {
        sourceImageData: imageData,
        manualMergeAnchors: [],
        disabledColors: [],
        sourcePickMode: false,
        loading: false,
      },
      { immediate: true },
    );
  },

  importFromPath: async (path) => {
    set({ loading: true, error: null });
    try {
      const sourceImageData = await loadSourceImageFromPath(imageProcessor, path);
      scheduleReprocess(
        get,
        set,
        {
          sourceImageData,
          manualMergeAnchors: [],
          disabledColors: [],
          sourcePickMode: false,
          loading: false,
        },
        { immediate: true },
      );
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
      scheduleReprocess(
        get,
        set,
        {
          sourceImageData,
          manualMergeAnchors: [],
          disabledColors: [],
          sourcePickMode: false,
          loading: false,
        },
        { immediate: true },
      );
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
      scheduleReprocess(
        get,
        set,
        {
          sourceImageData,
          manualMergeAnchors: [],
          disabledColors: [],
          sourcePickMode: false,
          loading: false,
        },
        { immediate: true },
      );
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
      scheduleReprocess(
        get,
        set,
        {
          sourceImageData,
          manualMergeAnchors: [],
          disabledColors: [],
          sourcePickMode: false,
          loading: false,
        },
        { immediate: true },
      );
    } catch {
      set({
        loading: false,
        error: "截图失败，请重试",
      });
    }
  },

  closeMonitorPicker: () => set({ monitorPickerOpen: false }),

  setOklabMergeThreshold: (threshold) => {
    scheduleReprocess(get, set, {
      oklabMergeThreshold: clampOklabMergeThreshold(threshold),
    });
  },

  setOklabReduceAlgorithm: (algorithm) => {
    scheduleReprocess(get, set, { oklabReduceAlgorithm: algorithm });
  },

  setSourcePickMode: (enabled) => set({ sourcePickMode: enabled }),

  addManualMergeAnchor: (color) => {
    const state = get();
    if (state.manualMergeAnchors.some((anchor) => anchor.color === color)) {
      return;
    }
    const anchor = createManualMergeAnchor(color, state.oklabMergeThreshold);
    scheduleReprocess(get, set, {
      manualMergeAnchors: [...state.manualMergeAnchors, anchor],
    });
  },

  removeManualMergeAnchor: (id) => {
    const state = get();
    scheduleReprocess(get, set, {
      manualMergeAnchors: state.manualMergeAnchors.filter((anchor) => anchor.id !== id),
    });
  },

  setManualMergeAnchorThreshold: (id, threshold) => {
    const state = get();
    const clamped = clampOklabMergeThreshold(threshold);
    scheduleReprocess(get, set, {
      manualMergeAnchors: state.manualMergeAnchors.map((anchor) =>
        anchor.id === id ? { ...anchor, threshold: clamped } : anchor,
      ),
    });
  },

  toggleNormalizedColorDisabled: (color) => {
    const state = get();
    const isDisabled = state.disabledColors.includes(color);
    const nextDisabled = isDisabled
      ? state.disabledColors.filter((entry) => entry !== color)
      : [...state.disabledColors, color];
    scheduleReprocess(get, set, { disabledColors: nextDisabled });
  },

  cancelProcessing: () => {
    if (reprocessDebounceTimer) {
      clearTimeout(reprocessDebounceTimer);
      reprocessDebounceTimer = null;
    }
    void cancelActiveColorEditJob(activeReprocessJobId);
    reprocessGeneration += 1;
    lastHandledGeneration = reprocessGeneration;
    reprocessQueued = false;
    set({ processing: false, error: null });
  },

  reprocess: () => {
    scheduleReprocess(get, set, {}, { immediate: true });
  },
}));

useColorEditStore.subscribe((state, prev) => {
  if (isHydratingPreferences) return;

  if (
    state.oklabMergeThreshold === prev.oklabMergeThreshold &&
    state.oklabReduceAlgorithm === prev.oklabReduceAlgorithm
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
