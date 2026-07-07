export interface GridRelativeOffset {
  x: number;
  y: number;
}

export interface GridCellOrigin {
  x: number;
  y: number;
}

export function computeSecondaryGridCellOrigin(
  pixelX: number,
  pixelY: number,
  secondarySize: number,
): GridCellOrigin {
  return computeSecondaryGridCellOriginWithSpans(
    pixelX,
    pixelY,
    secondarySize,
    secondarySize,
  );
}

export function computeSecondaryGridCellOriginWithSpans(
  pixelX: number,
  pixelY: number,
  spanX: number,
  spanY: number,
): GridCellOrigin {
  const sizeX = Math.max(1, spanX);
  const sizeY = Math.max(1, spanY);
  return {
    x: Math.floor(pixelX / sizeX) * sizeX,
    y: Math.floor(pixelY / sizeY) * sizeY,
  };
}

/** 正交视图下子网格高亮：Y 轴在每个主格内按 secondarySpanY 划分 */
export function computeOrthographicSecondaryGridCellOrigin(
  pixelX: number,
  pixelY: number,
  secondary: number,
  primarySpanY: number,
  secondarySpanY: number,
): GridCellOrigin {
  const spanX = Math.max(1, secondary);
  const spanY = Math.max(1, secondarySpanY);
  const primarySpan = Math.max(1, primarySpanY);
  const originX = Math.floor(pixelX / spanX) * spanX;
  const primaryOriginY = Math.floor(Math.max(0, pixelY) / primarySpan) * primarySpan;
  const localY = Math.max(0, pixelY) - primaryOriginY;
  const subIndex = Math.floor(localY / spanY);
  const originY = primaryOriginY + subIndex * spanY;
  return { x: originX, y: originY };
}

export function computeRelativeOffsetWithinSecondaryGrid(
  pixelX: number,
  pixelY: number,
  secondarySize: number,
): GridRelativeOffset {
  const size = Math.max(1, secondarySize);
  const mod = (v: number) => ((v % size) + size) % size;
  return { x: mod(pixelX) + 1, y: mod(pixelY) + 1 };
}

export function formatGridRelativePosition(offset: GridRelativeOffset): string {
  return `(${offset.x}, ${offset.y})`;
}
