import { useEffect, useState } from "react";
import { findAssetById, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { isImageAsset } from "@/domain/asset/AssetRecord";
import { loadAssetImageAsImageData } from "@/infrastructure/storage/AssetImageLoader";
import { ImageViewerModal } from "@/presentation/components/imagePreview/ImageViewerModal";

interface AssetImageViewerModalProps {
  open: boolean;
  workspacePath: string;
  library: AssetLibraryIndex | null;
  assetId: string | null;
  onClose: () => void;
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

  const asset =
    open && library && assetId ? findAssetById(library, assetId) : null;
  const imageAsset = asset && isImageAsset(asset) ? asset : null;

  useEffect(() => {
    if (!open || !imageAsset || !workspacePath) {
      setImageData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setImageData(null);

    void loadAssetImageAsImageData(workspacePath, imageAsset.imageFile).then((data) => {
      if (cancelled) return;
      setImageData(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, imageAsset?.id, imageAsset?.imageFile, workspacePath]);

  if (!open || !imageAsset) return null;

  return (
    <ImageViewerModal
      open={open}
      imageData={imageData}
      loading={loading}
      title={imageAsset.title}
      subtitle={`${imageAsset.width}×${imageAsset.height} · 滚轮缩放 · 拖拽平移 · Esc 关闭`}
      onClose={onClose}
    />
  );
}
