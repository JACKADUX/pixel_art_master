import { swatchIndexToShortcutLabel } from "@/domain/luminancePalette/LuminancePaletteNavigation";

interface LuminancePaletteShortcutColumnProps {
  rowCount: number;
  editMode: boolean;
  showToolbarSpacer: boolean;
}

export function LuminancePaletteShortcutColumn({
  rowCount,
  editMode,
  showToolbarSpacer,
}: LuminancePaletteShortcutColumnProps) {
  if (rowCount === 0) return null;

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5" aria-hidden>
      {editMode && showToolbarSpacer && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-4 w-4 shrink-0" />
          <div className="flex h-4 items-center gap-0.5">
            <div className="h-3 w-3 shrink-0" />
            <div className="h-3 w-3 shrink-0" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {Array.from({ length: rowCount }, (_, index) => (
          <span
            key={index}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] leading-none text-zinc-500"
          >
            {swatchIndexToShortcutLabel(index)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function computeLuminancePaletteShortcutRowCount(
  groups: readonly { colors: readonly unknown[] }[],
): number {
  if (groups.length === 0) return 0;
  return groups.reduce((max, group) => Math.max(max, group.colors.length), 0);
}
