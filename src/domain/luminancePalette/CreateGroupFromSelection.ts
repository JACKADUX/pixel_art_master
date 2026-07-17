import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import { extractColorsFromSelection } from "@/domain/selection/SelectionColorExtraction";
import type { SelectionState } from "@/domain/selection/SelectionState";
import {
  createLuminancePaletteGroup,
  formatDefaultLuminanceGroupName,
  LUMINANCE_PALETTE_MAX_SWATCHES,
} from "./LuminancePaletteGroup";
import type { LuminancePaletteGroup } from "./LuminancePaletteGroup";
import { sortAndLimitColorEntriesByOklchLightness } from "./LuminancePaletteSort";

export function createGroupFromSelectionColors(
  grid: WritableCanvasSurface,
  selection: SelectionState,
  groupIndex: number,
): LuminancePaletteGroup | null {
  const entries = extractColorsFromSelection(grid, selection);
  if (entries.length === 0) return null;

  const swatches = sortAndLimitColorEntriesByOklchLightness(
    entries,
    LUMINANCE_PALETTE_MAX_SWATCHES,
  );

  return createLuminancePaletteGroup(
    swatches,
    formatDefaultLuminanceGroupName(groupIndex),
  );
}
