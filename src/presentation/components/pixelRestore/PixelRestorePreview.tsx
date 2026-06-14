import { ImagePreviewWorkspace } from "../imagePreview/ImagePreviewWorkspace";

interface PixelRestorePreviewProps {
  imageData: ImageData | null;
  label: string;
}

export function PixelRestorePreview({
  imageData,
  label,
}: PixelRestorePreviewProps) {
  return (
    <ImagePreviewWorkspace
      imageData={imageData}
      label={label}
      pixelated
      showZoomLabel
    />
  );
}
