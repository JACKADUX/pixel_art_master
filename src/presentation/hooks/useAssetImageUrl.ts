import { useEffect, useState } from "react";
import {
  loadAssetImageBlobUrl,
  revokeAssetImageBlobUrl,
} from "@/infrastructure/storage/AssetImageLoader";

export function useAssetImageUrl(
  workspacePath: string,
  imageFile: string | null | undefined,
): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!workspacePath || !imageFile) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    let blobUrl: string | null = null;

    void loadAssetImageBlobUrl(workspacePath, imageFile).then((url) => {
      if (cancelled) {
        if (url) revokeAssetImageBlobUrl(url);
        return;
      }
      blobUrl = url;
      setSrc(url);
    });

    return () => {
      cancelled = true;
      if (blobUrl) revokeAssetImageBlobUrl(blobUrl);
    };
  }, [workspacePath, imageFile]);

  return src;
}
