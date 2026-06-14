import { useEffect, useMemo, useRef, useState } from "react";
import { findAssetById, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { buildColorPaletteFromImageData } from "@/domain/image/ImageColorPalette";
import { loadAssetImageAsImageData } from "@/infrastructure/storage/AssetImageLoader";
import { ImagePaletteFloatingPanel } from "@/presentation/components/imagePreview/ImagePaletteFloatingPanel";
import { ImagePreviewWorkspace } from "@/presentation/components/imagePreview/ImagePreviewWorkspace";

interface AssetImageViewerModalProps {
  open: boolean;
  workspacePath: string;
  library: AssetLibraryIndex | null;
  assetId: string | null;
  onClose: () => void;
}

function toggleButtonClass(active: boolean): string {
  return `rounded border px-2.5 py-1 text-xs font-medium transition ${
    active
      ? "border-blue-500 bg-blue-500/15 text-blue-300"
      : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
  }`;
}

export function AssetImageViewerModal({
  open,
  workspacePath,
  library,
  assetId,
  onClose,
}: AssetImageViewerModalProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOklabLightness, setShowOklabLightness] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 0, height: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const asset =
    open && library && assetId ? findAssetById(library, assetId) : null;

  const paletteColors = useMemo(
    () =>
      imageData
        ? buildColorPaletteFromImageData(imageData, Number.MAX_SAFE_INTEGER)
        : [],
    [imageData],
  );

  useEffect(() => {
    if (!open || !asset || !workspacePath) {
      setImageData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setImageData(null);

    void loadAssetImageAsImageData(workspacePath, asset.imageFile).then((data) => {
      if (cancelled) return;
      setImageData(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, asset?.id, asset?.imageFile, workspacePath]);

  useEffect(() => {
    if (!open) {
      setShowOklabLightness(false);
      setShowPalette(false);
    }
  }, [open]);

  useEffect(() => {
    setShowOklabLightness(false);
    setShowPalette(false);
  }, [assetId]);

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

  if (!open || !asset) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/85">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-zinc-100">{asset.title}</h3>
          <p className="text-[10px] text-zinc-500">
            {asset.width}×{asset.height} · 滚轮缩放 · 拖拽平移 · Esc 关闭
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOklabLightness((value) => !value)}
            className={toggleButtonClass(showOklabLightness)}
          >
            Oklab 明度
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
            displayMode={showOklabLightness ? "oklabLightness" : "normal"}
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
