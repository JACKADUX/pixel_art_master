import { useMemo } from "react";
import { computeGridLayout, type GridLayout } from "@/domain/pixelRestore/GridRestoreOperations";
import { computeRegionGridLayout, type RegionGridLayout } from "@/domain/pixelRestore/RegionGridRestoreOperations";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";

export function useGridLayout(): GridLayout | null {
  const sourceImageData = usePixelRestoreStore((s) => s.sourceImageData);
  const gridScaleType = usePixelRestoreStore((s) => s.gridScaleType);
  const gridSeedCell = usePixelRestoreStore((s) => s.gridSeedCell);

  return useMemo(() => {
    if (gridScaleType !== "singleCell" || !sourceImageData || !gridSeedCell) return null;
    return computeGridLayout(
      { width: sourceImageData.width, height: sourceImageData.height },
      gridSeedCell,
    );
  }, [sourceImageData, gridSeedCell, gridScaleType]);
}

export function useRegionGridLayout(): RegionGridLayout | null {
  const sourceImageData = usePixelRestoreStore((s) => s.sourceImageData);
  const gridScaleType = usePixelRestoreStore((s) => s.gridScaleType);
  const gridRegion = usePixelRestoreStore((s) => s.gridRegion);
  const gridColumnCount = usePixelRestoreStore((s) => s.gridColumnCount);
  const gridRowCount = usePixelRestoreStore((s) => s.gridRowCount);

  return useMemo(() => {
    if (gridScaleType !== "region" || !sourceImageData || !gridRegion) return null;
    return computeRegionGridLayout(gridRegion, gridColumnCount, gridRowCount);
  }, [sourceImageData, gridScaleType, gridRegion, gridColumnCount, gridRowCount]);
}
