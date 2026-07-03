import { useEffect, useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { getNodeTitle, type ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { decodeImageBlobToImageData } from "@/infrastructure/image/decodeImageBlob";
import { ContextMenu } from "@/presentation/components/ContextMenu";
import type { MenuItem } from "@/presentation/components/MenuDropdown";
import { ImageViewerModal } from "@/presentation/components/imagePreview/ImageViewerModal";
import { toast } from "@/presentation/stores/toastStore";
import { useAppStore } from "@/presentation/stores/appStore";
import { useComfyUiStore, type ComfyResultItem } from "@/presentation/stores/comfyUiStore";

interface ComfyResultCarouselProps {
  results: ComfyResultItem[];
  workflow?: ComfyApiWorkflow | null;
  /** 当前应用标识：切换应用时重置查看序号（同一应用内的多次生成保留序号） */
  appId?: string;
}

/**
 * 结果图单图轮播：顶部仅显示一张，多结果按列表顺序左右切换。
 * 图片右上角「更多」按钮提供 保存 / 入库 / 导入到画布 / 作为参考图导入 / 保存到剪贴板。
 */
export function ComfyResultCarousel({ results, workflow, appId }: ComfyResultCarouselProps) {
  const saveResultToLocal = useComfyUiStore((s) => s.saveResultToLocal);
  const saveImageToAssetLibrary = useAppStore((s) => s.saveImageToAssetLibrary);
  const importImageDataToDrawingLayer = useAppStore((s) => s.importImageDataToDrawingLayer);
  const importImageDataToReferenceLayer = useAppStore((s) => s.importImageDataToReferenceLayer);
  const copyImageToClipboard = useAppStore((s) => s.copyImageToClipboard);
  const hasProject = useAppStore((s) => s.project !== null);

  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<ComfyResultItem | null>(null);
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // 切换应用时重置查看序号
  useEffect(() => {
    setIndex(0);
  }, [appId]);

  // 保留当前查看序号：生成期间结果会被临时清空，此时不重置；
  // 有结果后仅在序号越界时收敛到最后一张，从而「下次生成仍显示第 N 张」。
  useEffect(() => {
    if (results.length === 0) return;
    setIndex((prev) => (prev < results.length ? prev : results.length - 1));
  }, [results.length]);

  useEffect(() => {
    if (!preview) {
      setPreviewImageData(null);
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewImageData(null);
    void decodeImageBlobToImageData(preview.blob)
      .then((data) => {
        if (!cancelled) setPreviewImageData(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("无法加载结果图");
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preview]);

  if (results.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-zinc-600">执行完成后，结果图将在此显示</p>
    );
  }

  const current = results[Math.min(index, results.length - 1)];
  const sourceLabel = (nodeId: string): string => {
    const node = workflow?.[nodeId];
    return (node ? getNodeTitle(node) : null) ?? `节点 #${nodeId}`;
  };

  const goPrev = () => setIndex((prev) => (prev - 1 + results.length) % results.length);
  const goNext = () => setIndex((prev) => (prev + 1) % results.length);

  const withImageData = async (action: (imageData: ImageData) => void) => {
    try {
      const imageData = await decodeImageBlobToImageData(current.blob);
      action(imageData);
    } catch {
      toast.error("无法读取结果图");
    }
  };

  const menuItems: MenuItem[] = [
    {
      type: "action",
      label: "保存",
      onClick: () => void saveResultToLocal(current),
    },
    {
      type: "action",
      label: "入库",
      onClick: () =>
        void withImageData((imageData) =>
          void saveImageToAssetLibrary(imageData, `ComfyUI ${current.ref.filename}`),
        ),
    },
    {
      type: "action",
      label: "导入到画布",
      disabled: !hasProject,
      onClick: () =>
        void withImageData((imageData) =>
          importImageDataToDrawingLayer(imageData, `ComfyUI ${current.ref.filename}`),
        ),
    },
    {
      type: "action",
      label: "作为参考图导入",
      disabled: !hasProject,
      onClick: () =>
        void withImageData((imageData) =>
          importImageDataToReferenceLayer(imageData, `ComfyUI ${current.ref.filename}`),
        ),
    },
    {
      type: "action",
      label: "保存到剪贴板",
      onClick: () => void copyImageToClipboard(current.blob),
    },
  ];

  const openMenu = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.bottom });
  };

  return (
    <>
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded bg-zinc-950">
          <button
            type="button"
            onClick={() => setPreview(current)}
            className="block w-full"
            title="点击放大查看"
          >
            <img
              src={current.objectUrl}
              alt={current.ref.filename}
              className="mx-auto max-h-64 w-full object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </button>

          <button
            type="button"
            onClick={openMenu}
            title="更多操作"
            className="absolute right-1 top-1 rounded bg-black/50 p-1 text-zinc-100 transition hover:bg-black/70"
            aria-haspopup="menu"
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </button>

          {results.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-sm text-zinc-100 transition hover:bg-black/70"
                aria-label="上一张"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-sm text-zinc-100 transition hover:bg-black/70"
                aria-label="下一张"
              >
                ›
              </button>
              <span className="absolute bottom-1 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-zinc-200">
                {index + 1} / {results.length}
              </span>
            </>
          )}
        </div>

        <p className="truncate text-[10px] text-zinc-600">
          {current.ref.filename} · 来源：{sourceLabel(current.ref.nodeId)}
        </p>
      </div>

      {menuPosition && (
        <ContextMenu
          position={menuPosition}
          items={menuItems}
          onClose={() => setMenuPosition(null)}
        />
      )}

      <ImageViewerModal
        open={preview !== null}
        imageData={previewImageData}
        loading={previewLoading}
        title={preview?.ref.filename ?? "结果图"}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
