import { getTileCell } from "@/domain/tile/TileRegion";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import {
  type CanvasScreenTransform,
  logicalRectToScreenHeight,
  logicalRectToScreenWidth,
  logicalToScreenX,
  logicalToScreenY,
} from "@/domain/viewport/CanvasScreenTransform";

const CENTER_STROKE = "rgba(34, 197, 94, 0.95)";

export function renderTileOverlay(
  ctx: CanvasRenderingContext2D,
  region: SelectionRect,
  transform: CanvasScreenTransform,
): void {
  if (region.width <= 0 || region.height <= 0) return;

  const center = getTileCell(region, 0, 0);
  const x = logicalToScreenX(center.x, transform);
  const y = logicalToScreenY(center.y, transform);
  const w = logicalRectToScreenWidth(center.width, transform);
  const h = logicalRectToScreenHeight(center.height, transform);

  ctx.save();
  ctx.strokeStyle = CENTER_STROKE;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}
