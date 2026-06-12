import type { CropRect, ReferenceGridConfig } from "@/domain/layer/Layer";
import { renderCanvasGrid } from "./CanvasGridRenderer";

export function renderReferenceLayer(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  crop: CropRect,
  zoom: number,
  grid: ReferenceGridConfig,
): void {
  const displayWidth = crop.width * zoom;
  const displayHeight = crop.height * zoom;

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    displayWidth,
    displayHeight,
  );

  if (grid.visible) {
    renderCanvasGrid(
      ctx,
      crop.width,
      crop.height,
      zoom,
      grid.primary,
      grid.secondary,
    );
  }
}
