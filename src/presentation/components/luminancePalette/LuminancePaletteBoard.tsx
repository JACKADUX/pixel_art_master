import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { LuminancePaletteData } from "@/domain/luminancePalette/LuminancePalette";
import {
  createVirtualTrailingEmptyGroup,
  isVirtualTrailingEmptyGroup,
  LUMINANCE_PALETTE_MAX_SWATCHES,
  type LuminancePaletteGroup,
} from "@/domain/luminancePalette/LuminancePaletteGroup";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ColorSlot } from "@/presentation/stores/appStore";
import { PALETTE_COLOR_DRAG_MIME } from "./luminancePaletteDrag";
import {
  computeLuminancePaletteShortcutRowCount,
  LuminancePaletteShortcutColumn,
} from "./LuminancePaletteShortcutColumn";
import { LuminancePaletteSwatchCell } from "./LuminancePaletteSwatchCell";

export interface LuminancePaletteLiveEditTarget {
  groupId: string;
  swatchIndex: number;
}

interface LuminancePaletteBoardProps {
  palette: LuminancePaletteData;
  editMode: boolean;
  liveEditTarget: LuminancePaletteLiveEditTarget | null;
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  onSelect: (slot: ColorSlot, color: PixelColor) => void;
  onActivateGroup: (groupId: string) => void;
  onSetSwatchForeground: (groupId: string, index: number) => void;
  onRemoveSwatch: (groupId: string, index: number) => void;
  onImportDroppedColors: (groupId: string, hexes: string[]) => void;
  onMoveGroup?: (groupId: string, direction: "left" | "right") => void;
  onRequestRemoveGroup?: (groupId: string, groupName: string) => void;
  onActivateLiveEdit: (groupId: string, index: number) => void;
  onDeactivateLiveEdit: () => void;
  interactive?: boolean;
  showActiveRing?: boolean;
}

interface GroupSlotsProps {
  group: LuminancePaletteGroup;
  groupIndex: number;
  groupCount: number;
  orientation: "vertical" | "horizontal";
  editMode: boolean;
  liveEditTarget: LuminancePaletteLiveEditTarget | null;
  activeGroupId: string | null;
  foregroundColor: PixelColor;
  backgroundColor: PixelColor;
  interactive: boolean;
  showActiveRing: boolean;
  onSelect: (slot: ColorSlot, color: PixelColor) => void;
  onActivateGroup: (groupId: string) => void;
  onSetSwatchForeground: (groupId: string, index: number) => void;
  onRemoveSwatch: (groupId: string, index: number) => void;
  onImportDroppedColors: (groupId: string, hexes: string[]) => void;
  onMoveGroup?: (groupId: string, direction: "left" | "right") => void;
  onRequestRemoveGroup?: (groupId: string, groupName: string) => void;
  onActivateLiveEdit: (groupId: string, index: number) => void;
  onDeactivateLiveEdit: () => void;
}

function LuminancePaletteGroupSlots({
  group,
  groupIndex,
  groupCount,
  orientation,
  editMode,
  liveEditTarget,
  activeGroupId,
  foregroundColor,
  backgroundColor,
  interactive,
  showActiveRing,
  onSelect,
  onActivateGroup,
  onSetSwatchForeground,
  onRemoveSwatch,
  onImportDroppedColors,
  onMoveGroup,
  onRequestRemoveGroup,
  onActivateLiveEdit,
  onDeactivateLiveEdit,
}: GroupSlotsProps) {
  const isVirtual = isVirtualTrailingEmptyGroup(group.id);

  const handleDrop = (event: React.DragEvent) => {
    if (!interactive || !editMode || isVirtual) return;
    event.preventDefault();
    const raw = event.dataTransfer.getData(PALETTE_COLOR_DRAG_MIME);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { hexes?: string[] };
      if (Array.isArray(parsed.hexes) && parsed.hexes.length > 0) {
        onImportDroppedColors(group.id, parsed.hexes);
      }
    } catch {
      // ignore invalid payload
    }
  };

  const isLiveEditing = (index: number) =>
    liveEditTarget?.groupId === group.id && liveEditTarget.swatchIndex === index;

  const handleDeactivateIfNeeded = (index: number) => {
    if (
      liveEditTarget &&
      (liveEditTarget.groupId !== group.id || liveEditTarget.swatchIndex !== index)
    ) {
      onDeactivateLiveEdit();
    }
  };

  const renderSwatches = () => {
    if (editMode) {
      const slots = Array.from({ length: LUMINANCE_PALETTE_MAX_SWATCHES }, (_, index) => {
        return group.colors[index] ?? null;
      });

      return slots.map((swatch, index) => (
        <LuminancePaletteSwatchCell
          key={swatch?.hex ?? `empty-${group.id}-${index}`}
          mode={swatch ? "filled" : "empty"}
          interactionMode="edit"
          swatch={swatch ?? undefined}
          swatchIndex={index}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          isLiveEditing={isLiveEditing(index)}
          interactive={interactive}
          onSelect={onSelect}
          onSetSwatchForeground={() => {
            handleDeactivateIfNeeded(index);
            onActivateGroup(group.id);
            onSetSwatchForeground(group.id, index);
          }}
          onRemove={() => {
            if (isVirtual) return;
            onDeactivateLiveEdit();
            onRemoveSwatch(group.id, index);
          }}
          onActivate={() => {
            handleDeactivateIfNeeded(index);
            onActivateGroup(group.id);
          }}
          onActivateLiveEdit={() => {
            if (!swatch || isVirtual) return;
            onActivateLiveEdit(group.id, index);
          }}
          onDeactivateLiveEdit={() => {
            if (isLiveEditing(index)) onDeactivateLiveEdit();
          }}
        />
      ));
    }

    return group.colors.map((swatch, index) => (
      <LuminancePaletteSwatchCell
        key={swatch.hex}
        mode="filled"
        interactionMode="normal"
        swatch={swatch}
        swatchIndex={index}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        interactive={interactive}
        onSelect={onSelect}
        onRemove={() => onRemoveSwatch(group.id, index)}
        onActivate={() => onActivateGroup(group.id)}
      />
    ));
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      {editMode && onMoveGroup && !isVirtual && (
        <div className="flex flex-col items-center gap-0.5">
          {onRequestRemoveGroup && (
            <button
              type="button"
              title="删除组"
              onClick={(event) => {
                event.stopPropagation();
                onRequestRemoveGroup(group.id, group.name);
              }}
              className="rounded p-0.5 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-300"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          )}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title="前移组"
              disabled={groupIndex === 0}
              onClick={(event) => {
                event.stopPropagation();
                onMoveGroup(group.id, "left");
              }}
              className="rounded p-0.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              title="后移组"
              disabled={groupIndex >= groupCount - 1}
              onClick={(event) => {
                event.stopPropagation();
                onMoveGroup(group.id, "right");
              }}
              className="rounded p-0.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div
        className={`flex shrink-0 gap-1 ${
          orientation === "horizontal" ? "flex-row" : "flex-col"
        } ${showActiveRing && activeGroupId === group.id ? "rounded-sm ring-1 ring-blue-500/60" : ""}`}
        onMouseDown={() => onActivateGroup(group.id)}
        onDragOver={(event) => {
          if (!interactive || !editMode || isVirtual) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDrop}
      >
        {renderSwatches()}
      </div>
    </div>
  );
}

function buildDisplayGroups(
  palette: LuminancePaletteData,
  editMode: boolean,
): LuminancePaletteGroup[] {
  const groups = editMode
    ? [...palette.groups]
    : palette.groups.filter((group) => group.colors.length > 0);

  if (!editMode) return groups;

  const last = groups.length > 0 ? groups[groups.length - 1] : undefined;
  if (!last || last.colors.length > 0) {
    groups.push(createVirtualTrailingEmptyGroup(groups.length + 1));
  }

  return groups;
}

export function LuminancePaletteBoard({
  palette,
  editMode,
  liveEditTarget,
  showActiveRing = true,
  interactive = true,
  foregroundColor,
  backgroundColor,
  onSelect,
  onActivateGroup,
  onSetSwatchForeground,
  onRemoveSwatch,
  onImportDroppedColors,
  onMoveGroup,
  onRequestRemoveGroup,
  onActivateLiveEdit,
  onDeactivateLiveEdit,
}: LuminancePaletteBoardProps) {
  const visibleGroups = buildDisplayGroups(palette, editMode);
  const realGroups = visibleGroups.filter((group) => !isVirtualTrailingEmptyGroup(group.id));
  const realGroupCount = realGroups.length;
  const shortcutRowCount = computeLuminancePaletteShortcutRowCount(realGroups);

  if (visibleGroups.length === 0) {
    return (
      <p className="whitespace-nowrap px-1 py-2 text-[10px] text-zinc-500">
        暂无有效颜色，请开启编辑模式添加
      </p>
    );
  }

  const groupOrientation: "vertical" | "horizontal" = "vertical";

  const sharedProps = {
    groupCount: realGroupCount,
    orientation: groupOrientation,
    editMode,
    liveEditTarget,
    activeGroupId: palette.activeGroupId,
    foregroundColor,
    backgroundColor,
    interactive,
    showActiveRing,
    onSelect,
    onActivateGroup,
    onSetSwatchForeground,
    onRemoveSwatch,
    onImportDroppedColors,
    onMoveGroup: editMode ? onMoveGroup : undefined,
    onRequestRemoveGroup: editMode ? onRequestRemoveGroup : undefined,
    onActivateLiveEdit,
    onDeactivateLiveEdit,
  };

  return (
    <div
      className="flex flex-row gap-1"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onDeactivateLiveEdit();
        }
      }}
    >
      <LuminancePaletteShortcutColumn
        rowCount={shortcutRowCount}
        editMode={editMode}
        showToolbarSpacer={editMode && realGroupCount > 0}
      />
      {visibleGroups.map((group, groupIndex) => (
        <LuminancePaletteGroupSlots
          key={group.id}
          group={group}
          groupIndex={groupIndex}
          {...sharedProps}
        />
      ))}
    </div>
  );
}
