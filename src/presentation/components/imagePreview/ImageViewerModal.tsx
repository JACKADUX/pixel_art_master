import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  imageDataToPixelGrid,
  pixelGridToPngBlob,
} from "@/application/use-cases/ClipboardUseCases";
import { buildColorPaletteFromImageData } from "@/domain/image/ImageColorPalette";
import { cropImageData } from "@/domain/image/ImageDataOperations";
import type { CropRect } from "@/domain/layer/Layer";
import {
  moveRegionRect,
  resizeRegionRect,
} from "@/domain/selection/RegionSelectRect";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { CheckerboardOptions } from "@/infrastructure/canvas/CanvasBackgroundRenderer";
import { useAppStore } from "@/presentation/stores/appStore";
import { toast } from "@/presentation/stores/toastStore";
import { ImagePaletteFloatingPanel } from "./ImagePaletteFloatingPanel";
import { ImagePreviewWorkspace } from "./ImagePreviewWorkspace";

interface ImageViewerModalProps {
  open: boolean;
  imageData: ImageData | null;
  title: string;
  subtitle?: string;
  loading?: boolean;
  onClose: () => void;
}

function toggleButtonClass(active: boolean): string {
  return `rounded border px-2.5 py-1 text-xs font-medium transition ${
    active
      ? "border-blue-500 bg-blue-500/15 text-blue-300"
      : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
  }`;
}

/**
 * 通用图片大图查看器，与资产库共用同一套缩放/平移/OKLCH/色板能力。
 * 调用方负责提供已解码的 ImageData。
 */
export function ImageViewerModal({
  open,
  imageData,
  title,
  subtitle,
  loading = false,
  onClose,
}: ImageViewerModalProps) {
  const [showOklchLightness, setShowOklchLightness] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [selection, setSelection] = useState<CropRect | null>(null);

  // 选框开关持久化到应用设置，关闭/重开查看器或重启应用都会记住上次选择。
  const selectionMode = useAppStore((s) => s.appSettings.imageViewerSelectionModeEnabled);
  const setImageViewerSelectionModeEnabled = useAppStore(
    (s) => s.setImageViewerSelectionModeEnabled,
  );
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 0, height: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const hasProject = useAppStore((s) => s.project !== null);
  const importImageDataToDrawingLayer = useAppStore((s) => s.importImageDataToDrawingLayer);
  const importImageDataToReferenceLayer = useAppStore(
    (s) => s.importImageDataToReferenceLayer,
  );
  const copyImageToClipboard = useAppStore((s) => s.copyImageToClipboard);
  const saveImageToAssetLibrary = useAppStore((s) => s.saveImageToAssetLibrary);

  // 透明棋盘格底色沿用画布编辑器的设置，保持一致的观感。
  const checkerboardTileSize = useAppStore((s) => s.appSettings.checkerboardTileSize);
  const checkerboardLightHex = useAppStore((s) => s.appSettings.checkerboardLightHex);
  const checkerboardDarkHex = useAppStore((s) => s.appSettings.checkerboardDarkHex);
  // 「透明底」开关持久化到应用设置，关闭/重开查看器或重启应用都会记住上次选择。
  const showCheckerboard = useAppStore((s) => s.appSettings.imageViewerCheckerboardEnabled);
  const setImageViewerCheckerboardEnabled = useAppStore(
    (s) => s.setImageViewerCheckerboardEnabled,
  );
  const checkerboardOptions = useMemo<CheckerboardOptions>(
    () => ({
      tileSize: checkerboardTileSize,
      lightColor: checkerboardLightHex,
      darkColor: checkerboardDarkHex,
    }),
    [checkerboardTileSize, checkerboardLightHex, checkerboardDarkHex],
  );

  // 色板提取对大图开销较大，故延迟到首次点击「色板」按钮后再计算。
  // 以 imageData 引用为键缓存结果，避免反复开关面板时重复计算。
  const [paletteColors, setPaletteColors] = useState<ColorEntry[]>([]);
  const paletteCacheRef = useRef<{ source: ImageData | null; colors: ColorEntry[] }>({
    source: null,
    colors: [],
  });

  useEffect(() => {
    if (!showPalette || !imageData) return;

    if (paletteCacheRef.current.source === imageData) {
      setPaletteColors(paletteCacheRef.current.colors);
      return;
    }

    const colors = buildColorPaletteFromImageData(imageData, Number.MAX_SAFE_INTEGER);
    paletteCacheRef.current = { source: imageData, colors };
    setPaletteColors(colors);
  }, [showPalette, imageData]);

  useEffect(() => {
    if (!open) {
      setShowOklchLightness(false);
      setShowPalette(false);
      // 选框开关持久化保留，仅清空当前选区。
      setSelection(null);
      // 关闭后清空色板数据与缓存，避免长期占用内存，下次打开重新按需计算。
      setPaletteColors([]);
      paletteCacheRef.current = { source: null, colors: [] };
    }
  }, [open]);

  // 切换图片时重置选框，避免旧选区落在新图越界位置。
  useEffect(() => {
    setSelection(null);
  }, [imageData]);

  const selectionImageData = useCallback((): ImageData | null => {
    if (!imageData || !selection) return null;
    return cropImageData(imageData, selection);
  }, [imageData, selection]);

  const selectionTitle = `${title} 选区`;

  const handleCopySelection = useCallback(async () => {
    const cropped = selectionImageData();
    if (!cropped) return;
    try {
      const blob = await pixelGridToPngBlob(imageDataToPixelGrid(cropped));
      await copyImageToClipboard(blob);
    } catch {
      toast.error("复制选区失败");
    }
  }, [selectionImageData, copyImageToClipboard]);

  const handleImportSelectionToReference = useCallback(() => {
    const cropped = selectionImageData();
    if (!cropped) return;
    importImageDataToReferenceLayer(cropped, selectionTitle);
  }, [selectionImageData, importImageDataToReferenceLayer, selectionTitle]);

  const handleImportSelectionToLayer = useCallback(() => {
    const cropped = selectionImageData();
    if (!cropped) return;
    importImageDataToDrawingLayer(cropped, selectionTitle);
  }, [selectionImageData, importImageDataToDrawingLayer, selectionTitle]);

  const handleSaveSelectionToLibrary = useCallback(() => {
    const cropped = selectionImageData();
    if (!cropped) return;
    void saveImageToAssetLibrary(cropped, selectionTitle);
  }, [selectionImageData, saveImageToAssetLibrary, selectionTitle]);

  const toggleSelectionMode = useCallback(() => {
    const next = !selectionMode;
    setImageViewerSelectionModeEnabled(next);
    if (!next) setSelection(null);
  }, [selectionMode, setImageViewerSelectionModeEnabled]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl && (event.key === "c" || event.key === "C") && selection) {
        event.preventDefault();
        void handleCopySelection();
        return;
      }

      if (selectionMode && selection && imageData) {
        const imageSize = { width: imageData.width, height: imageData.height };
        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (arrowKeys.includes(event.key)) {
          event.preventDefault();
          const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
          const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
          setSelection((prev) =>
            prev
              ? event.shiftKey
                ? resizeRegionRect(prev, dx, dy, imageSize)
                : moveRegionRect(prev, dx, dy, imageSize)
              : prev,
          );
          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (selection) {
          setSelection(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, selection, selectionMode, imageData, handleCopySelection]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || !open) return;

    const updateSize = () => {
      setPreviewContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [open, loading]);

  if (!open) return null;

  const resolvedSubtitle = selectionMode
    ? "左键拖拽框选 · 拖角点调整 · 方向键移动 · Shift+方向键缩放 · 中键平移 · 右键取消 · Ctrl+C 复制"
    : (subtitle ??
      (imageData
        ? `${imageData.width}×${imageData.height} · 滚轮缩放 · 拖拽平移 · Esc 关闭`
        : "滚轮缩放 · 拖拽平移 · Esc 关闭"));

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/85">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-zinc-100">{title}</h3>
          <p className="text-[10px] text-zinc-500">{resolvedSubtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={toggleButtonClass(selectionMode)}
          >
            选框
          </button>
          <button
            type="button"
            onClick={() => setShowOklchLightness((value) => !value)}
            className={toggleButtonClass(showOklchLightness)}
          >
            OKLCH 明度
          </button>
          <button
            type="button"
            onClick={() => setShowPalette((value) => !value)}
            className={toggleButtonClass(showPalette)}
          >
            色板
          </button>
          <button
            type="button"
            onClick={() => setImageViewerCheckerboardEnabled(!showCheckerboard)}
            className={toggleButtonClass(showCheckerboard)}
          >
            透明底
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={previewContainerRef} className="relative min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            加载中...
          </div>
        ) : (
          <ImagePreviewWorkspace
            imageData={imageData}
            emptyLabel="无法加载图像"
            pixelated
            panMouseButton={0}
            className="h-full"
            displayMode={showOklchLightness ? "oklchLightness" : "normal"}
            checkerboard={showCheckerboard ? checkerboardOptions : null}
            selectionMode={selectionMode}
            selection={selection}
            onSelectionChange={setSelection}
          />
        )}

        {showPalette && imageData && previewContainerSize.width > 0 && (
          <ImagePaletteFloatingPanel
            colors={paletteColors}
            totalColorCount={paletteColors.length}
            containerSize={previewContainerSize}
            onClose={() => setShowPalette(false)}
          />
        )}

        {selectionMode && selection && imageData && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur">
            <span className="px-1 text-[11px] text-zinc-400">
              选区 {selection.width} × {selection.height}
            </span>
            <button
              type="button"
              onClick={() => void handleCopySelection()}
              className="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-blue-500 hover:text-blue-300"
            >
              复制到剪贴板
            </button>
            <button
              type="button"
              onClick={handleImportSelectionToReference}
              disabled={!hasProject}
              className="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              导入为参考图
            </button>
            <button
              type="button"
              onClick={handleImportSelectionToLayer}
              disabled={!hasProject}
              className="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              导入为图层
            </button>
            <button
              type="button"
              onClick={handleSaveSelectionToLibrary}
              className="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200 transition hover:border-blue-500 hover:text-blue-300"
            >
              入库
            </button>
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="rounded px-1.5 py-1 text-xs text-zinc-500 transition hover:text-zinc-200"
              title="取消选区"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
