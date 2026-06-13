import { useCallback, useState } from "react";
import {
  computeRelativeOffsetWithinSecondaryGrid,
  type GridRelativeOffset,
} from "@/domain/grid/GridRelativePosition";

export interface GridCellScreenBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MousePositionOverlayState {
  offset: GridRelativeOffset;
  labelX: number;
  labelY: number;
  cellBounds: GridCellScreenBounds;
}

export function useMousePositionOverlay() {
  const [overlay, setOverlay] = useState<MousePositionOverlayState | null>(null);

  const update = useCallback(
    (
      labelX: number,
      labelY: number,
      cellBounds: GridCellScreenBounds,
      pixelX: number,
      pixelY: number,
      secondarySize: number,
    ) => {
      setOverlay({
        offset: computeRelativeOffsetWithinSecondaryGrid(pixelX, pixelY, secondarySize),
        labelX,
        labelY,
        cellBounds,
      });
    },
    [],
  );

  const clear = useCallback(() => {
    setOverlay(null);
  }, []);

  return { overlay, update, clear };
}
