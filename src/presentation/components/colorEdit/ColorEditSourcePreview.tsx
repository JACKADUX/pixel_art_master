import { useCallback } from "react";
import { getAlpha, rgba } from "@/domain/canvas/PixelColor";
import { ImagePreviewWorkspace } from "../imagePreview/ImagePreviewWorkspace";
import { useColorEditStore } from "../../stores/colorEditStore";

export function ColorEditSourcePreview() {
  const sourceImageData = useColorEditStore((s) => s.sourceImageData);
  const sourcePickMode = useColorEditStore((s) => s.sourcePickMode);
  const addManualMergeAnchor = useColorEditStore((s) => s.addManualMergeAnchor);

  const handlePickPixel = useCallback(
    (x: number, y: number) => {
      if (!sourceImageData) return;
      const offset = (y * sourceImageData.width + x) * 4;
      const { data } = sourceImageData;
      const color = rgba(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
      if (getAlpha(color) === 0) return;
      addManualMergeAnchor(color);
    },
    [sourceImageData, addManualMergeAnchor],
  );

  return (
    <ImagePreviewWorkspace
      imageData={sourceImageData}
      label="原图"
      emptyLabel="请导入图片"
      pixelated
      showZoomLabel
      className="h-full"
      pickMode={sourcePickMode}
      onPickPixel={handlePickPixel}
    />
  );
}
