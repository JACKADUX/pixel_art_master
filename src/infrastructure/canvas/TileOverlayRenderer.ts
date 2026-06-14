import { getTileCell } from "@/domain/tile/TileRegion";
import type { SelectionRect } from "@/domain/selection/SelectionRect";

const CENTER_STROKE = "rgba(34, 197, 94, 0.95)";

export function renderTileOverlay(
  ctx: CanvasRenderingContext2D,
  region: SelectionRect,
  zoom: number,
): void {
  if (region.width <= 0 || region.height <= 0) return;

  const center = getTileCell(region, 0, 0);
  const x = center.x * zoom;
  const y = center.y * zoom;
  const w = center.width * zoom;
  const h = center.height * zoom;

  ctx.save();
  ctx.strokeStyle = CENTER_STROKE;
  ctx.lineWidth = Math.max(1.5, 2 / zoom);
  ctx.setLineDash([]);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}
