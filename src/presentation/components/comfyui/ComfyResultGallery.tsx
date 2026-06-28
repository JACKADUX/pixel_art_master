import { useEffect, useState } from "react";
import { getNodeTitle, type ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { decodeImageBlobToImageData } from "@/infrastructure/image/decodeImageBlob";
import { ImageViewerModal } from "@/presentation/components/imagePreview/ImageViewerModal";
import { toast } from "@/presentation/stores/toastStore";
import { useAppStore } from "@/presentation/stores/appStore";
import {
  useComfyUiStore,
  type ComfyResultItem,
} from "@/presentation/stores/comfyUiStore";

interface ComfyResultGalleryProps {
  /** 外部传入的结果图（如应用运行弹窗）；不传则使用编辑器 store 的结果 */
  results?: ComfyResultItem[];
  /** 用于显示来源节点标题的工作流；不传则使用编辑器 store 的工作流 */
  workflow?: ComfyApiWorkflow | null;
}

export function ComfyResultGallery({
  results: resultsProp,
  workflow: workflowProp,
}: ComfyResultGalleryProps = {}) {
  const storeResults = useComfyUiStore((s) => s.results);
  const storeWorkflow = useComfyUiStore((s) => s.workflow);
  const saveResultToLocal = useComfyUiStore((s) => s.saveResultToLocal);
  const saveImageToAssetLibrary = useAppStore((s) => s.saveImageToAssetLibrary);

  const results = resultsProp ?? storeResults;
  const workflow = workflowProp !== undefined ? workflowProp : storeWorkflow;

  const sourceLabel = (nodeId: string): string => {
    const node = workflow?.[nodeId];
    return (node ? getNodeTitle(node) : null) ?? `节点 #${nodeId}`;
  };

  const [preview, setPreview] = useState<ComfyResultItem | null>(null);
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

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
      <p className="py-6 text-center text-xs text-zinc-600">
        执行完成后，结果图将在此显示
      </p>
    );
  }

  const handleImport = async (item: ComfyResultItem) => {
    setImportingId(item.id);
    try {
      const imageData = await decodeImageBlobToImageData(item.blob);
      await saveImageToAssetLibrary(imageData, `ComfyUI ${item.ref.filename}`);
    } catch {
      toast.error("导入资产库失败");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {results.map((item) => (
          <div
            key={item.id}
            className="space-y-2 rounded border border-zinc-800 bg-zinc-900/50 p-2"
          >
            <button
              type="button"
              onClick={() => setPreview(item)}
              className="block w-full overflow-hidden rounded bg-zinc-950"
            >
              <img
                src={item.objectUrl}
                alt={item.ref.filename}
                className="mx-auto max-h-48 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </button>
            <p className="truncate text-[10px] text-zinc-500">{item.ref.filename}</p>
            <p className="truncate text-[10px] text-zinc-600">
              来源：{sourceLabel(item.ref.nodeId)}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => void saveResultToLocal(item)}
                className="flex-1 rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200 transition hover:bg-zinc-700"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => void handleImport(item)}
                disabled={importingId === item.id}
                className="flex-1 rounded bg-blue-600 px-2 py-1 text-[11px] text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {importingId === item.id ? "导入中…" : "入库"}
              </button>
            </div>
          </div>
        ))}
      </div>

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
