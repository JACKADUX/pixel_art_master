import { ImagePreviewWorkspace } from "../imagePreview/ImagePreviewWorkspace";

interface ColorEditResultPreviewProps {
  imageData: ImageData | null;
}

export function ColorEditResultPreview({ imageData }: ColorEditResultPreviewProps) {
  return (
    <ImagePreviewWorkspace
      imageData={imageData}
      label="结果"
      emptyLabel="调整参数后自动生成"
      pixelated
      showZoomLabel
      className="h-full"
    />
  );
}
