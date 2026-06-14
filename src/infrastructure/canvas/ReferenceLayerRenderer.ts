import type { CropRect, ReferenceGridConfig } from "@/domain/layer/Layer";
import {
  DEFAULT_APP_SETTINGS,
  gridColorRgbString,
} from "@/domain/appSettings/AppSettings";
import { renderCanvasGrid, type CanvasGridRenderOptions } from "./CanvasGridRenderer";

export type GridAppearanceOptions = Pick<
  CanvasGridRenderOptions,
  "colorRgb" | "lineWidth" | "subGridEnabled"
>;

function defaultGridAppearance(): GridAppearanceOptions {
  return {
    colorRgb: gridColorRgbString(DEFAULT_APP_SETTINGS.gridColorHex),
    lineWidth: DEFAULT_APP_SETTINGS.gridLineWidth,
    subGridEnabled: DEFAULT_APP_SETTINGS.subGridEnabled,
  };
}

export function renderReferenceLayerGrid(
  ctx: CanvasRenderingContext2D,
  crop: CropRect,
  zoom: number,
  grid: ReferenceGridConfig,
  appearance?: GridAppearanceOptions,
): void {
  if (!grid.visible) return;
  const resolvedAppearance = appearance ?? defaultGridAppearance();
  renderCanvasGrid(ctx, crop.width, crop.height, zoom, {
    primary: grid.primary,
    secondary: grid.secondary,
    ...resolvedAppearance,
  });
}

export function renderReferenceLayer(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  crop: CropRect,
  zoom: number,
  grid: ReferenceGridConfig,
  appearance?: GridAppearanceOptions,
): void {
  const displayWidth = crop.width * zoom;
  const displayHeight = crop.height * zoom;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, displayWidth, displayHeight);
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
  renderReferenceLayerGrid(ctx, crop, zoom, grid, appearance);
}
