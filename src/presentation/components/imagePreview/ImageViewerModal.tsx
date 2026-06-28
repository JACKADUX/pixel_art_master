import { useEffect, useMemo, useRef, useState } from "react";
import { buildColorPaletteFromImageData } from "@/domain/image/ImageColorPalette";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { CheckerboardOptions } from "@/infrastructure/canvas/CanvasBackgroundRenderer";
import { useAppStore } from "@/presentation/stores/appStore";
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
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 0, height: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

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
      // 关闭后清空色板数据与缓存，避免长期占用内存，下次打开重新按需计算。
      setPaletteColors([]);
      paletteCacheRef.current = { source: null, colors: [] };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

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

  const resolvedSubtitle =
    subtitle ??
    (imageData
      ? `${imageData.width}×${imageData.height} · 滚轮缩放 · 拖拽平移 · Esc 关闭`
      : "滚轮缩放 · 拖拽平移 · Esc 关闭");

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
      </div>
    </div>
  );
}
