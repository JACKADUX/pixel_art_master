import { create } from "zustand";
import type { CapturableMonitor } from "@/application/ports/ICaptureService";
import {
  applyGridRestore,
  applyRegionGridRestore,
} from "@/application/use-cases/GridRestoreUseCases";
import { loadPixelRestorePreferences } from "@/application/use-cases/LoadPixelRestorePreferences";
import { savePixelRestorePreferences } from "@/application/use-cases/SavePixelRestorePreferences";
import {
  analyzeSourceImage,
  applyFixedScaleRestore,
  captureMonitorToImagePath,
  loadSourceImageFromClipboard,
  loadSourceImageFromPath,
} from "@/application/use-cases/PixelRestoreUseCases";
import type { CropRect } from "@/domain/layer/Layer";
import { clampCropRect } from "@/domain/layer/ReferenceLayerOperations";
import { canApplyFixedScaleRestore } from "@/domain/pixelRestore/FixedScaleRestoreOperations";
import {
  adjustSeedBottomRight,
  adjustSeedTopLeft,
  normalizeSeedRect,
} from "@/domain/pixelRestore/GridCellOperations";
import { type GridMergeAlgorithm } from "@/domain/pixelRestore/GridMergeAlgorithm";
import { computeGridLayout } from "@/domain/pixelRestore/GridRestoreOperations";
import {
  DEFAULT_PIXEL_RESTORE_PREFERENCES,
  extractPixelRestorePreferences,
  type PixelRestoreMode,
} from "@/domain/pixelRestore/PixelRestorePreferences";
import {
  clampGridCount,
  computeRegionGridLayout,
} from "@/domain/pixelRestore/RegionGridRestoreOperations";
import { type GridScaleType } from "@/domain/pixelRestore/GridScaleType";
import { clipboardService } from "@/infrastructure/clipboard/createClipboardService";
import { imageProcessor } from "@/infrastructure/image/CanvasImageProcessor";
import { pixelRestorePreferencesRepository } from "@/infrastructure/storage/LocalPixelRestorePreferencesRepository";
import { captureService } from "@/infrastructure/tauri/TauriCaptureService";

export type RestoreMode = PixelRestoreMode;

interface PixelRestoreStore {
  open: boolean;
  sourceImageData: ImageData | null;
  detectedScale: number;
  selectedScale: number;
  resultImageData: ImageData | null;
  loading: boolean;
  error: string | null;
  monitorPickerOpen: boolean;
  availableMonitors: CapturableMonitor[];
  restoreMode: RestoreMode;
  gridScaleType: GridScaleType;
  gridSeedCell: CropRect | null;
  gridRegion: CropRect | null;
  gridColumnCount: number;
  gridRowCount: number;
  gridCreateActive: boolean;
  gridDrawing: boolean;
  mergeAlgorithm: GridMergeAlgorithm;

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  importFromPath: (path: string) => Promise<void>;
  importFromImageData: (imageData: ImageData) => void;
  importFromClipboard: () => Promise<void>;
  screenCapture: () => Promise<void>;
  captureFromMonitor: (monitorId: number) => Promise<void>;
  closeMonitorPicker: () => void;
  setRestoreMode: (mode: RestoreMode) => void;
  setScale: (scale: number) => void;
  reprocess: () => void;
  setGridScaleType: (type: GridScaleType) => void;
  startGridCreate: () => void;
  beginGridDrawing: () => void;
  commitGridSeedCell: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
  commitGridRegion: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
  cancelGridDrawing: () => void;
  setGridSeedCell: (seedCell: CropRect) => void;
  setGridRegion: (region: CropRect) => void;
  adjustGridSeed: (dx: number, dy: number, adjustBottomRight: boolean) => void;
  adjustGridRegion: (dx: number, dy: number, adjustBottomRight: boolean) => void;
  setGridColumnCount: (count: number) => void;
  setGridRowCount: (count: number) => void;
  adjustGridCounts: (dx: number, dy: number) => void;
  cancelGrid: () => void;
  setMergeAlgorithm: (algorithm: GridMergeAlgorithm) => void;
  applyGridRestoreResult: () => void;
}

const loadedPreferences =
  loadPixelRestorePreferences(pixelRestorePreferencesRepository) ??
  DEFAULT_PIXEL_RESTORE_PREFERENCES;

const sessionDefaults = {
  open: false,
  sourceImageData: null as ImageData | null,
  detectedScale: 1,
  resultImageData: null as ImageData | null,
  loading: false,
  error: null as string | null,
  monitorPickerOpen: false,
  availableMonitors: [] as CapturableMonitor[],
  gridSeedCell: null as CropRect | null,
  gridRegion: null as CropRect | null,
  gridCreateActive: false,
  gridDrawing: false,
};

const initialState = {
  ...sessionDefaults,
  restoreMode: loadedPreferences.restoreMode,
  selectedScale: loadedPreferences.selectedScale,
  mergeAlgorithm: loadedPreferences.mergeAlgorithm,
  gridScaleType: loadedPreferences.gridScaleType,
  gridColumnCount: loadedPreferences.gridColumnCount,
  gridRowCount: loadedPreferences.gridRowCount,
};

let isHydratingPreferences = true;
let preferencesSaveTimer: ReturnType<typeof setTimeout> | null = null;

isHydratingPreferences = false;

function resetGridSelection() {
  return {
    gridSeedCell: null as CropRect | null,
    gridRegion: null as CropRect | null,
    gridDrawing: false,
  };
}

function resetGridState() {
  return {
    ...resetGridSelection(),
    gridCreateActive: false,
  };
}

function enableGridCreateState() {
  return {
    ...resetGridSelection(),
    gridCreateActive: true,
  };
}

function clampCountsForRegion(
  innerRegion: CropRect,
  columns: number,
  rows: number,
) {
  return {
    gridColumnCount: clampGridCount(columns, innerRegion.width),
    gridRowCount: clampGridCount(rows, innerRegion.height),
  };
}

function regionGridError(
  innerRegion: CropRect,
  columns: number,
  rows: number,
): string | null {
  return computeRegionGridLayout(innerRegion, columns, rows)
    ? null
    : "当前区域无法生成有效网格";
}

function seedGridError(
  imageSize: { width: number; height: number },
  seedCell: CropRect,
): string | null {
  return computeGridLayout(imageSize, seedCell) ? null : "当前基准格无法生成有效网格";
}

function reprocessFixedScale(
  sourceImageData: ImageData,
  selectedScale: number,
): { resultImageData: ImageData | null; error: string | null } {
  try {
    const result = applyFixedScaleRestore(
      imageProcessor,
      sourceImageData,
      selectedScale,
    );
    return { resultImageData: result.resultImageData, error: null };
  } catch (err) {
    return {
      resultImageData: null,
      error: err instanceof Error ? err.message : "处理失败",
    };
  }
}

function resolveSelectedScale(
  sourceImageData: ImageData,
  preferredScale: number,
  defaultScale: number,
): number {
  const source = { width: sourceImageData.width, height: sourceImageData.height };
  if (canApplyFixedScaleRestore(source, { value: preferredScale })) {
    return preferredScale;
  }
  return defaultScale;
}

function applySourceImage(
  sourceImageData: ImageData,
  restoreMode: RestoreMode,
  preferredScale: number,
) {
  const analysis = analyzeSourceImage(imageProcessor, sourceImageData);
  const selectedScale = resolveSelectedScale(
    sourceImageData,
    preferredScale,
    analysis.defaultScale,
  );
  const gridReset = resetGridState();

  if (restoreMode === "gridScale") {
    return {
      sourceImageData,
      detectedScale: analysis.detectedScale,
      selectedScale,
      resultImageData: null,
      error: null,
      ...enableGridCreateState(),
    };
  }

  const { resultImageData, error } = reprocessFixedScale(
    sourceImageData,
    selectedScale,
  );
  return {
    sourceImageData,
    detectedScale: analysis.detectedScale,
    selectedScale,
    resultImageData,
    error,
    ...gridReset,
  };
}

function pickPreferenceFields(state: PixelRestoreStore) {
  return {
    restoreMode: state.restoreMode,
    selectedScale: state.selectedScale,
    mergeAlgorithm: state.mergeAlgorithm,
    gridScaleType: state.gridScaleType,
    gridColumnCount: state.gridColumnCount,
    gridRowCount: state.gridRowCount,
  };
}

export const usePixelRestoreStore = create<PixelRestoreStore>((set, get) => ({
  ...initialState,

  openPage: () => set({ open: true }),

  closePage: () => set({ open: false, monitorPickerOpen: false }),

  reset: () => {
    const prefs = pickPreferenceFields(get());
    set({
      ...sessionDefaults,
      open: get().open,
      ...prefs,
    });
  },

  importFromImageData: (imageData) => {
    const { restoreMode, selectedScale } = get();
    set({
      ...applySourceImage(imageData, restoreMode, selectedScale),
      loading: false,
      error: null,
    });
  },

  importFromPath: async (path) => {
    set({ loading: true, error: null });
    try {
      const sourceImageData = await loadSourceImageFromPath(imageProcessor, path);
      const { restoreMode, selectedScale } = get();
      set({ ...applySourceImage(sourceImageData, restoreMode, selectedScale), loading: false });
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
      const { restoreMode, selectedScale } = get();
      set({ ...applySourceImage(sourceImageData, restoreMode, selectedScale), loading: false });
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
      const { restoreMode, selectedScale } = get();
      set({ ...applySourceImage(sourceImageData, restoreMode, selectedScale), loading: false });
    } catch {
      set({
        loading: false,
        error: "截图失败，请重试",
      });
    }
  },

  closeMonitorPicker: () => set({ monitorPickerOpen: false }),

  setRestoreMode: (mode) => {
    if (!get().sourceImageData) {
      set({
        restoreMode: mode,
        ...(mode === "gridScale" ? enableGridCreateState() : resetGridState()),
      });
      return;
    }

    if (mode === "fixedScale") {
      const { sourceImageData, selectedScale } = get();
      const { resultImageData, error } = reprocessFixedScale(
        sourceImageData!,
        selectedScale,
      );
      set({ restoreMode: mode, resultImageData, error, ...resetGridState() });
      return;
    }

    set({
      restoreMode: mode,
      resultImageData: null,
      error: null,
      ...enableGridCreateState(),
    });
  },

  setScale: (scale) => {
    const { sourceImageData, restoreMode } = get();
    if (!sourceImageData || restoreMode !== "fixedScale") return;
    const { resultImageData, error } = reprocessFixedScale(sourceImageData, scale);
    set({ selectedScale: scale, resultImageData, error });
  },

  reprocess: () => {
    const { sourceImageData, selectedScale, restoreMode } = get();
    if (!sourceImageData || restoreMode !== "fixedScale") return;
    const { resultImageData, error } = reprocessFixedScale(
      sourceImageData,
      selectedScale,
    );
    set({ resultImageData, error });
  },

  setGridScaleType: (type) => {
    set({
      gridScaleType: type,
      resultImageData: null,
      error: null,
      ...enableGridCreateState(),
    });
  },

  startGridCreate: () => {
    set({
      restoreMode: "gridScale",
      gridCreateActive: true,
      gridDrawing: false,
      gridSeedCell: null,
      gridRegion: null,
      resultImageData: null,
      error: null,
    });
  },

  beginGridDrawing: () => set({ gridDrawing: true }),

  commitGridSeedCell: (start, end) => {
    const { sourceImageData } = get();
    if (!sourceImageData) return;
    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const seedCell = clampCropRect(normalizeSeedRect(start, end), imageSize);
    set({
      gridSeedCell: seedCell,
      gridRegion: null,
      gridCreateActive: false,
      gridDrawing: false,
      error: seedGridError(imageSize, seedCell),
    });
  },

  commitGridRegion: (start, end) => {
    const { sourceImageData, gridColumnCount, gridRowCount } = get();
    if (!sourceImageData) return;
    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const region = clampCropRect(normalizeSeedRect(start, end), imageSize);
    const counts = clampCountsForRegion(region, gridColumnCount, gridRowCount);
    set({
      gridRegion: region,
      gridSeedCell: null,
      gridCreateActive: false,
      gridDrawing: false,
      ...counts,
      error: regionGridError(region, counts.gridColumnCount, counts.gridRowCount),
    });
  },

  cancelGridDrawing: () => set({ gridDrawing: false }),

  setGridSeedCell: (seedCell) => {
    const { sourceImageData } = get();
    if (!sourceImageData) return;
    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const clamped = clampCropRect(seedCell, imageSize);
    set({
      gridSeedCell: clamped,
      gridCreateActive: false,
      gridDrawing: false,
      error: seedGridError(imageSize, clamped),
    });
  },

  setGridRegion: (region) => {
    const { sourceImageData, gridColumnCount, gridRowCount } = get();
    if (!sourceImageData) return;
    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const clamped = clampCropRect(region, imageSize);
    const counts = clampCountsForRegion(clamped, gridColumnCount, gridRowCount);
    set({
      gridRegion: clamped,
      gridCreateActive: false,
      gridDrawing: false,
      ...counts,
      error: regionGridError(clamped, counts.gridColumnCount, counts.gridRowCount),
    });
  },

  adjustGridSeed: (dx, dy, adjustBottomRight) => {
    const { sourceImageData, gridSeedCell } = get();
    if (!sourceImageData || !gridSeedCell) return;
    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const next = adjustBottomRight
      ? adjustSeedBottomRight(gridSeedCell, dx, dy, imageSize)
      : adjustSeedTopLeft(gridSeedCell, dx, dy, imageSize);
    set({
      gridSeedCell: next,
      error: seedGridError(imageSize, next),
    });
  },

  adjustGridRegion: (dx, dy, adjustBottomRight) => {
    const { sourceImageData, gridRegion, gridColumnCount, gridRowCount } = get();
    if (!sourceImageData || !gridRegion) return;
    const imageSize = { width: sourceImageData.width, height: sourceImageData.height };
    const next = adjustBottomRight
      ? adjustSeedBottomRight(gridRegion, dx, dy, imageSize)
      : adjustSeedTopLeft(gridRegion, dx, dy, imageSize);
    const counts = clampCountsForRegion(next, gridColumnCount, gridRowCount);
    set({
      gridRegion: next,
      ...counts,
      error: regionGridError(next, counts.gridColumnCount, counts.gridRowCount),
    });
  },

  setGridColumnCount: (count) => {
    const { gridRegion, gridRowCount } = get();
    if (!gridRegion) {
      set({ gridColumnCount: Math.max(1, Math.round(count)) });
      return;
    }
    const gridColumnCount = clampGridCount(count, gridRegion.width);
    set({
      gridColumnCount,
      error: regionGridError(gridRegion, gridColumnCount, gridRowCount),
    });
  },

  setGridRowCount: (count) => {
    const { gridRegion, gridColumnCount } = get();
    if (!gridRegion) {
      set({ gridRowCount: Math.max(1, Math.round(count)) });
      return;
    }
    const gridRowCount = clampGridCount(count, gridRegion.height);
    set({
      gridRowCount,
      error: regionGridError(gridRegion, gridColumnCount, gridRowCount),
    });
  },

  adjustGridCounts: (dx, dy) => {
    const { gridRegion, gridColumnCount, gridRowCount } = get();
    if (!gridRegion) return;
    const nextColumns = clampGridCount(gridColumnCount + dx, gridRegion.width);
    const nextRows = clampGridCount(gridRowCount + dy, gridRegion.height);
    set({
      gridColumnCount: nextColumns,
      gridRowCount: nextRows,
      error: regionGridError(gridRegion, nextColumns, nextRows),
    });
  },

  cancelGrid: () => {
    const { restoreMode } = get();
    set({
      ...resetGridSelection(),
      gridCreateActive: restoreMode === "gridScale",
      error: null,
    });
  },

  setMergeAlgorithm: (algorithm) => set({ mergeAlgorithm: algorithm }),

  applyGridRestoreResult: () => {
    const {
      sourceImageData,
      gridScaleType,
      gridSeedCell,
      gridRegion,
      gridColumnCount,
      gridRowCount,
      mergeAlgorithm,
    } = get();
    if (!sourceImageData) return;

    try {
      if (gridScaleType === "region") {
        if (!gridRegion) return;
        const result = applyRegionGridRestore(
          sourceImageData,
          gridRegion,
          gridColumnCount,
          gridRowCount,
          mergeAlgorithm,
        );
        set({ resultImageData: result.resultImageData, error: null });
        return;
      }

      if (!gridSeedCell) return;
      const result = applyGridRestore(sourceImageData, gridSeedCell, mergeAlgorithm);
      set({ resultImageData: result.resultImageData, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "网格缩放失败",
      });
    }
  },
}));

usePixelRestoreStore.subscribe((state, prev) => {
  if (isHydratingPreferences) return;

  if (
    state.restoreMode === prev.restoreMode &&
    state.selectedScale === prev.selectedScale &&
    state.mergeAlgorithm === prev.mergeAlgorithm &&
    state.gridScaleType === prev.gridScaleType &&
    state.gridColumnCount === prev.gridColumnCount &&
    state.gridRowCount === prev.gridRowCount
  ) {
    return;
  }

  if (preferencesSaveTimer) {
    clearTimeout(preferencesSaveTimer);
  }

  preferencesSaveTimer = setTimeout(() => {
    savePixelRestorePreferences(
      pixelRestorePreferencesRepository,
      extractPixelRestorePreferences(state),
    );
    preferencesSaveTimer = null;
  }, 300);
});
