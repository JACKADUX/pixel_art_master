import { useEffect, useState } from "react";
import {
  loadPatternBrushImageBlobUrl,
  revokePatternBrushImageBlobUrl,
} from "@/infrastructure/storage/PatternBrushImageLoader";

export function usePatternBrushImageUrl(
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

    void loadPatternBrushImageBlobUrl(workspacePath, imageFile).then((url) => {
      if (cancelled) {
        if (url) revokePatternBrushImageBlobUrl(url);
        return;
      }
      blobUrl = url;
      setSrc(url);
    });

    return () => {
      cancelled = true;
      if (blobUrl) revokePatternBrushImageBlobUrl(blobUrl);
    };
  }, [workspacePath, imageFile]);

  return src;
}
