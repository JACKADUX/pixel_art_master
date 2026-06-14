import { create } from "zustand";
import type { CapturableMonitor } from "@/application/ports/ICaptureService";
import {
  analyzeSourceImage,
  applyFixedScaleRestore,
  captureMonitorToImagePath,
  loadSourceImageFromClipboard,
  loadSourceImageFromPath,
} from "@/application/use-cases/PixelRestoreUseCases";
import { clipboardService } from "@/infrastructure/clipboard/createClipboardService";
import { imageProcessor } from "@/infrastructure/image/CanvasImageProcessor";
import { captureService } from "@/infrastructure/tauri/TauriCaptureService";

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

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  importFromPath: (path: string) => Promise<void>;
  importFromImageData: (imageData: ImageData) => void;
  importFromClipboard: () => Promise<void>;
  screenCapture: () => Promise<void>;
  captureFromMonitor: (monitorId: number) => Promise<void>;
  closeMonitorPicker: () => void;
  setScale: (scale: number) => void;
  reprocess: () => void;
}

const initialState = {
  open: false,
  sourceImageData: null as ImageData | null,
  detectedScale: 1,
  selectedScale: 2,
  resultImageData: null as ImageData | null,
  loading: false,
  error: null as string | null,
  monitorPickerOpen: false,
  availableMonitors: [] as CapturableMonitor[],
};

function reprocessImage(
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

function applySourceImage(sourceImageData: ImageData) {
  const analysis = analyzeSourceImage(imageProcessor, sourceImageData);
  const selectedScale = analysis.defaultScale;
  const { resultImageData, error } = reprocessImage(
    sourceImageData,
    selectedScale,
  );
  return {
    sourceImageData,
    detectedScale: analysis.detectedScale,
    selectedScale,
    resultImageData,
    error,
  };
}

export const usePixelRestoreStore = create<PixelRestoreStore>((set, get) => ({
  ...initialState,

  openPage: () => set({ open: true }),

  closePage: () => set({ open: false, monitorPickerOpen: false }),

  reset: () => set({ ...initialState, open: get().open }),

  importFromImageData: (imageData) => {
    set({ ...applySourceImage(imageData), loading: false, error: null });
  },

  importFromPath: async (path) => {
    set({ loading: true, error: null });
    try {
      const sourceImageData = await loadSourceImageFromPath(imageProcessor, path);
      set({ ...applySourceImage(sourceImageData), loading: false });
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
      set({ ...applySourceImage(sourceImageData), loading: false });
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
      set({ ...applySourceImage(sourceImageData), loading: false });
    } catch {
      set({
        loading: false,
        error: "截图失败，请重试",
      });
    }
  },

  closeMonitorPicker: () => set({ monitorPickerOpen: false }),

  setScale: (scale) => {
    const { sourceImageData } = get();
    if (!sourceImageData) return;
    const { resultImageData, error } = reprocessImage(sourceImageData, scale);
    set({ selectedScale: scale, resultImageData, error });
  },

  reprocess: () => {
    const { sourceImageData, selectedScale } = get();
    if (!sourceImageData) return;
    const { resultImageData, error } = reprocessImage(
      sourceImageData,
      selectedScale,
    );
    set({ resultImageData, error });
  },
}));
