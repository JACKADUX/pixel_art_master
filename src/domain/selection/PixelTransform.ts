import { PixelGrid } from "../canvas/PixelGrid";
import { TRANSPARENT } from "../canvas/PixelColor";

export type TransformAnchor = "center" | "topLeft";

export function scaleGrid(
  grid: PixelGrid,
  scaleX: number,
  scaleY: number,
  anchor: TransformAnchor = "center",
): PixelGrid {
  const newWidth = Math.max(1, Math.round(grid.width * scaleX));
  const newHeight = Math.max(1, Math.round(grid.height * scaleY));
  const result = PixelGrid.createEmpty(newWidth, newHeight);

  const anchorX = anchor === "center" ? grid.width / 2 : 0;
  const anchorY = anchor === "center" ? grid.height / 2 : 0;
  const newAnchorX = anchor === "center" ? newWidth / 2 : 0;
  const newAnchorY = anchor === "center" ? newHeight / 2 : 0;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.round((x - newAnchorX) / scaleX + anchorX);
      const srcY = Math.round((y - newAnchorY) / scaleY + anchorY);
      if (srcX >= 0 && srcX < grid.width && srcY >= 0 && srcY < grid.height) {
        result.setPixel(x, y, grid.getPixel(srcX, srcY));
      }
    }
  }

  return result;
}

export function rotateGrid(grid: PixelGrid, angleDeg: number): PixelGrid {
  const radians = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const cx = (grid.width - 1) / 2;
  const cy = (grid.height - 1) / 2;

  const corners = [
    { x: -cx, y: -cy },
    { x: grid.width - 1 - cx, y: -cy },
    { x: grid.width - 1 - cx, y: grid.height - 1 - cy },
    { x: -cx, y: grid.height - 1 - cy },
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const c of corners) {
    const rx = cos * c.x - sin * c.y;
    const ry = sin * c.x + cos * c.y;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }

  const newWidth = Math.max(1, Math.round(maxX - minX) + 1);
  const newHeight = Math.max(1, Math.round(maxY - minY) + 1);
  const result = PixelGrid.createEmpty(newWidth, newHeight);

  const newCx = (newWidth - 1) / 2;
  const newCy = (newHeight - 1) / 2;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const dx = x - newCx;
      const dy = y - newCy;
      const srcX = Math.round(cos * dx + sin * dy + cx);
      const srcY = Math.round(-sin * dx + cos * dy + cy);
      if (srcX >= 0 && srcX < grid.width && srcY >= 0 && srcY < grid.height) {
        result.setPixel(x, y, grid.getPixel(srcX, srcY));
      }
    }
  }

  return result;
}

export function rotateGrid90(grid: PixelGrid, steps: number): PixelGrid {
  const normalized = ((steps % 4) + 4) % 4;
  if (normalized === 0) return grid.clone();

  let current = grid;
  for (let i = 0; i < normalized; i++) {
    current = rotate90Once(current);
  }
  return current;
}

function rotate90Once(grid: PixelGrid): PixelGrid {
  const newWidth = grid.height;
  const newHeight = grid.width;
  const result = PixelGrid.createEmpty(newWidth, newHeight);

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      result.setPixel(grid.height - 1 - y, x, grid.getPixel(x, y));
    }
  }

  return result;
}

export function flipGridHorizontal(grid: PixelGrid): PixelGrid {
  const result = PixelGrid.createEmpty(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      result.setPixel(grid.width - 1 - x, y, grid.getPixel(x, y));
    }
  }
  return result;
}

export function flipGridVertical(grid: PixelGrid): PixelGrid {
  const result = PixelGrid.createEmpty(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      result.setPixel(x, grid.height - 1 - y, grid.getPixel(x, y));
    }
  }
  return result;
}

export function clearGrid(grid: PixelGrid): void {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      grid.setPixel(x, y, TRANSPARENT);
    }
  }
}
