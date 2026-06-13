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
  const size = Math.max(1, secondarySize);
  return {
    x: Math.floor(pixelX / size) * size,
    y: Math.floor(pixelY / size) * size,
  };
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
