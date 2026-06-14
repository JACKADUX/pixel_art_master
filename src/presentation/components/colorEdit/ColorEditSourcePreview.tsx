import { ImagePreviewWorkspace } from "../imagePreview/ImagePreviewWorkspace";
import { sampleSourcePixel, useColorEditStore } from "../../stores/colorEditStore";

export function ColorEditSourcePreview() {
  const sourceImageData = useColorEditStore((s) => s.sourceImageData);
  const pickColorMode = useColorEditStore((s) => s.pickColorMode);
  const pickColorFromSource = useColorEditStore((s) => s.pickColorFromSource);

  const handlePickPixel = (x: number, y: number) => {
    const color = sampleSourcePixel(x, y);
    if (!color) return;
    pickColorFromSource(color);
  };

  return (
    <ImagePreviewWorkspace
      imageData={sourceImageData}
      label={pickColorMode ? "原图（吸色模式）" : "原图"}
      emptyLabel="请导入图片"
      pixelated
      showZoomLabel
      className="h-full"
      pickMode={pickColorMode}
      onPickPixel={handlePickPixel}
    />
  );
}
