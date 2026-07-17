import { getActiveLayerProjectedSurfaceFromProject } from "@/application/use-cases/LayerUseCases";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import { colorsEqual } from "@/domain/canvas/PixelColor";
import { createGroupFromSelectionColors } from "@/domain/luminancePalette/CreateGroupFromSelection";
import {
  addColorToLuminanceGroup,
  addLuminancePaletteGroup,
  finalizeLiveEditSwatch,
  importColorsToLuminanceGroup,
  moveLuminancePaletteGroup,
  removeLuminancePaletteGroup,
  removeSwatchFromLuminanceGroup,
  replaceLuminanceSwatchColorLive,
  replaceLuminancePaletteData,
  setLuminancePaletteActiveGroupId,
  setLuminancePaletteGroupArrangement,
  setLuminanceSwatchColorAtIndex,
  type LuminancePaletteData,
  type LuminancePaletteGroupArrangement,
} from "@/domain/luminancePalette/LuminancePalette";
import { isVirtualTrailingEmptyGroup } from "@/domain/luminancePalette/LuminancePaletteGroup";
import { finalizeLuminancePalette } from "@/domain/luminancePalette/LuminancePaletteSanitize";
import {
  navigateGroupColor,
  pickColorByShortcutIndex,
  pickGroupByShortcutIndex,
  pickFirstColorInGroup,
  resolveActiveGroup,
  shortcutKeyToGroupIndex,
  shortcutKeyToSwatchIndex,
  type LuminancePaletteNavigationDirection,
} from "@/domain/luminancePalette/LuminancePaletteNavigation";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { Project } from "@/domain/project/Project";
import { isSelectionEmpty } from "@/domain/selection/SelectionState";
import {
  adaptPanelPositionOnResize,
  applyMagneticSnap,
  DEFAULT_PANEL_EDGE_ANCHOR,
  detectEdgeAnchor,
  type PanelEdgeAnchor,
} from "@/domain/viewport/FloatingPanelAnchor";
import { clampPanelPosition } from "@/domain/viewport/FloatingPanelBounds";
import {
  DEFAULT_LUMINANCE_PALETTE_PANEL_HEIGHT,
  DEFAULT_LUMINANCE_PALETTE_PANEL_WIDTH,
} from "@/domain/preferences/EditorPreferences";
import { toast } from "@/presentation/stores/toastStore";

export interface LuminancePaletteLiveEditTarget {
  groupId: string;
  swatchIndex: number;
}

export interface LuminancePalettePanelState {
  visible: boolean;
  position: { x: number; y: number };
  panelWidth: number;
  panelHeight: number;
  edgeAnchor: PanelEdgeAnchor;
  editMode: boolean;
  liveEditTarget: LuminancePaletteLiveEditTarget | null;
}

export interface LuminancePaletteSliceState {
  luminancePalettePanel: LuminancePalettePanelState;
}

export interface LuminancePaletteSliceActions {
  toggleLuminancePalettePanel: () => void;
  openLuminancePalettePanel: () => void;
  closeLuminancePalettePanel: () => void;
  setLuminancePalettePanelPositionWithAnchor: (
    x: number,
    y: number,
    anchor?: PanelEdgeAnchor,
  ) => void;
  setLuminancePalettePanelSize: (width: number, height: number) => void;
  finalizeLuminancePalettePanelDrag: () => void;
  setLuminancePaletteGroupArrangement: (arrangement: LuminancePaletteGroupArrangement) => void;
  toggleLuminancePaletteEditMode: () => void;
  setLuminancePaletteActiveGroup: (groupId: string) => void;
  addLuminancePaletteGroupAction: () => void;
  removeLuminancePaletteGroupAction: (groupId: string) => void;
  moveLuminancePaletteGroupAction: (groupId: string, direction: "left" | "right") => void;
  setLuminanceSwatchForeground: (groupId: string, swatchIndex: number) => void;
  activateLuminanceSwatchLiveEdit: (groupId: string, swatchIndex: number) => void;
  deactivateLuminanceSwatchLiveEdit: () => void;
  addForegroundToLuminanceGroup: (groupId: string) => void;
  removeLuminanceSwatch: (groupId: string, swatchIndex: number) => void;
  importColorsToLuminanceGroupAction: (groupId: string, entries: readonly ColorEntry[]) => void;
  createLuminanceGroupFromSelection: () => void;
  pickLuminancePaletteColorByShortcut: (key: string) => void;
  pickLuminancePaletteGroupByShortcut: (key: string) => void;
  navigateLuminancePaletteColor: (direction: LuminancePaletteNavigationDirection) => void;
  replaceProjectLuminancePalette: (data: Pick<LuminancePaletteData, "groups" | "groupArrangement">) => void;
}

type LuminancePaletteStoreSlice = LuminancePaletteSliceState & {
  project: Project | null;
  foregroundColor: PixelColor;
  viewportContainer: HTMLDivElement | null;
  selection: import("@/domain/selection/SelectionState").SelectionState | null;
};

type LuminancePaletteSet = (
  partial:
    | Partial<LuminancePaletteStoreSlice>
    | ((state: LuminancePaletteStoreSlice) => Partial<LuminancePaletteStoreSlice>),
) => void;

type LuminancePaletteGet = () => LuminancePaletteStoreSlice & {
  openLuminancePalettePanel: () => void;
};

function getContainerDimensions(container: HTMLDivElement | null) {
  if (!container) return null;
  return { width: container.clientWidth, height: container.clientHeight };
}

function updateProjectLuminancePalette(
  project: Project,
  updater: (palette: LuminancePaletteData) => LuminancePaletteData,
): Project {
  return {
    ...project,
    luminancePalette: updater(project.luminancePalette),
  };
}

export function createLuminancePalettePanelInitialState(): LuminancePalettePanelState {
  return {
    visible: false,
    position: { x: 32, y: 32 },
    panelWidth: DEFAULT_LUMINANCE_PALETTE_PANEL_WIDTH,
    panelHeight: DEFAULT_LUMINANCE_PALETTE_PANEL_HEIGHT,
    edgeAnchor: { ...DEFAULT_PANEL_EDGE_ANCHOR },
    editMode: false,
    liveEditTarget: null,
  };
}

function deactivateLiveEdit(
  get: LuminancePaletteGet,
  set: LuminancePaletteSet,
): void {
  const panel = get().luminancePalettePanel;
  const project = get().project;
  if (!panel.liveEditTarget) return;

  if (!project) {
    set({ luminancePalettePanel: { ...panel, liveEditTarget: null } });
    return;
  }

  const { groupId } = panel.liveEditTarget;
  const nextPalette = finalizeLiveEditSwatch(project.luminancePalette, groupId);
  set({
    luminancePalettePanel: { ...panel, liveEditTarget: null },
    project: { ...project, luminancePalette: nextPalette },
  });
}

export function createLuminancePaletteSlice(
  set: LuminancePaletteSet,
  get: LuminancePaletteGet,
): LuminancePaletteSliceState & LuminancePaletteSliceActions {
  const mutatePalette = (updater: (palette: LuminancePaletteData) => LuminancePaletteData) => {
    const project = get().project;
    if (!project) return;
    set({ project: updateProjectLuminancePalette(project, updater) });
  };

  return {
    luminancePalettePanel: createLuminancePalettePanelInitialState(),

    toggleLuminancePalettePanel: () => {
      const panel = get().luminancePalettePanel;
      if (panel.visible) {
        set({ luminancePalettePanel: { ...panel, visible: false } });
        return;
      }
      get().openLuminancePalettePanel();
    },

    openLuminancePalettePanel: () =>
      set((s) => {
        const container = s.viewportContainer;
        const panel = s.luminancePalettePanel;
        if (!container) {
          return { luminancePalettePanel: { ...panel, visible: true } };
        }

        const isDefaultPosition = panel.position.x === 32 && panel.position.y === 32;
        const position = isDefaultPosition
          ? {
              x: Math.max(0, container.clientWidth - panel.panelWidth - 32),
              y: Math.max(0, container.clientHeight - panel.panelHeight - 32),
            }
          : panel.position;
        const edgeAnchor = isDefaultPosition
          ? { horizontal: "right" as const, vertical: "bottom" as const }
          : panel.edgeAnchor;

        return {
          luminancePalettePanel: {
            ...panel,
            visible: true,
            edgeAnchor,
            position: {
              x: Math.min(position.x, Math.max(0, container.clientWidth - panel.panelWidth)),
              y: Math.min(position.y, Math.max(0, container.clientHeight - panel.panelHeight)),
            },
          },
        };
      }),

    closeLuminancePalettePanel: () =>
      set((s) => ({
        luminancePalettePanel: { ...s.luminancePalettePanel, visible: false },
      })),

    setLuminancePalettePanelPositionWithAnchor: (x, y, anchor) =>
      set((s) => {
        const containerSize = getContainerDimensions(s.viewportContainer);
        const panelSize = {
          width: s.luminancePalettePanel.panelWidth,
          height: s.luminancePalettePanel.panelHeight,
        };

        if (!containerSize) {
          return {
            luminancePalettePanel: {
              ...s.luminancePalettePanel,
              position: { x, y },
              ...(anchor ? { edgeAnchor: anchor } : {}),
            },
          };
        }

        const snapped = applyMagneticSnap({ x, y }, panelSize, containerSize);
        return {
          luminancePalettePanel: {
            ...s.luminancePalettePanel,
            position: snapped.position,
            edgeAnchor: anchor ?? snapped.anchor,
          },
        };
      }),

    setLuminancePalettePanelSize: (width, height) =>
      set((s) => {
        const containerSize = getContainerDimensions(s.viewportContainer);
        const panelSize = { width, height };
        const position = containerSize
          ? adaptPanelPositionOnResize(
              s.luminancePalettePanel.position,
              panelSize,
              s.luminancePalettePanel.edgeAnchor,
              containerSize,
            )
          : s.luminancePalettePanel.position;
        return {
          luminancePalettePanel: {
            ...s.luminancePalettePanel,
            panelWidth: width,
            panelHeight: height,
            position,
          },
        };
      }),

    finalizeLuminancePalettePanelDrag: () =>
      set((s) => {
        const containerSize = getContainerDimensions(s.viewportContainer);
        if (!containerSize) return {};
        const panelSize = {
          width: s.luminancePalettePanel.panelWidth,
          height: s.luminancePalettePanel.panelHeight,
        };
        const edgeAnchor = detectEdgeAnchor(
          s.luminancePalettePanel.position,
          panelSize,
          containerSize,
        );
        const position = clampPanelPosition(
          s.luminancePalettePanel.position.x,
          s.luminancePalettePanel.position.y,
          panelSize.width,
          panelSize.height,
          containerSize.width,
          containerSize.height,
        );
        return {
          luminancePalettePanel: {
            ...s.luminancePalettePanel,
            position,
            edgeAnchor,
          },
        };
      }),

    setLuminancePaletteGroupArrangement: (arrangement) => {
      mutatePalette((palette) => setLuminancePaletteGroupArrangement(palette, arrangement));
    },

    toggleLuminancePaletteEditMode: () => {
      const panel = get().luminancePalettePanel;
      const nextEditMode = !panel.editMode;
      if (!nextEditMode) {
        deactivateLiveEdit(get, set);
        mutatePalette((palette) => finalizeLuminancePalette(palette));
      }
      set({
        luminancePalettePanel: {
          ...get().luminancePalettePanel,
          editMode: nextEditMode,
          liveEditTarget: nextEditMode ? get().luminancePalettePanel.liveEditTarget : null,
        },
      });
    },

    setLuminancePaletteActiveGroup: (groupId) => {
      mutatePalette((palette) => setLuminancePaletteActiveGroupId(palette, groupId));
    },

    addLuminancePaletteGroupAction: () => {
      mutatePalette((palette) =>
        addLuminancePaletteGroup(palette, undefined, { keepEmptyGroups: true }),
      );
    },

    removeLuminancePaletteGroupAction: (groupId) => {
      deactivateLiveEdit(get, set);
      mutatePalette((palette) => removeLuminancePaletteGroup(palette, groupId));
    },

    moveLuminancePaletteGroupAction: (groupId, direction) => {
      mutatePalette((palette) => moveLuminancePaletteGroup(palette, groupId, direction));
    },

    setLuminanceSwatchForeground: (groupId, swatchIndex) => {
      const project = get().project;
      if (!project) return;

      const editMode = get().luminancePalettePanel.editMode;
      let palette = project.luminancePalette;
      let targetGroupId = groupId;

      if (isVirtualTrailingEmptyGroup(groupId)) {
        palette = addLuminancePaletteGroup(palette, undefined, { keepEmptyGroups: true });
        targetGroupId = palette.activeGroupId ?? groupId;
      }

      const result = setLuminanceSwatchColorAtIndex(
        palette,
        targetGroupId,
        swatchIndex,
        get().foregroundColor,
        { resort: true, keepEmptyGroups: editMode },
      );

      if (!result.ok) {
        if (result.reason === "group_full") toast.info("该组已满（最多 10 色）");
        if (result.reason === "transparent") toast.info("不能添加透明色");
        return;
      }

      set({ project: { ...project, luminancePalette: result.palette } });
    },

    activateLuminanceSwatchLiveEdit: (groupId, swatchIndex) => {
      const project = get().project;
      if (!project || isVirtualTrailingEmptyGroup(groupId)) return;

      const group = project.luminancePalette.groups.find((item) => item.id === groupId);
      const swatch = group?.colors[swatchIndex];
      if (!swatch) return;

      const panel = get().luminancePalettePanel;
      if (
        panel.liveEditTarget?.groupId === groupId &&
        panel.liveEditTarget.swatchIndex === swatchIndex
      ) {
        return;
      }

      set({
        luminancePalettePanel: {
          ...panel,
          liveEditTarget: { groupId, swatchIndex },
        },
        foregroundColor: swatch.color,
      });
    },

    deactivateLuminanceSwatchLiveEdit: () => {
      deactivateLiveEdit(get, set);
    },

    addForegroundToLuminanceGroup: (groupId) => {
      const project = get().project;
      if (!project) return;
      const result = addColorToLuminanceGroup(
        project.luminancePalette,
        groupId,
        get().foregroundColor,
      );
      if (!result.ok) {
        if (result.reason === "group_full") toast.info("该组已满（最多 10 色）");
        if (result.reason === "duplicate") toast.info("该颜色已在组中");
        if (result.reason === "transparent") toast.info("不能添加透明色");
        return;
      }
      set({ project: { ...project, luminancePalette: result.palette } });
    },

    removeLuminanceSwatch: (groupId, swatchIndex) => {
      deactivateLiveEdit(get, set);
      const editMode = get().luminancePalettePanel.editMode;
      mutatePalette((palette) =>
        removeSwatchFromLuminanceGroup(palette, groupId, swatchIndex, {
          keepEmptyGroups: editMode,
        }),
      );
    },

    importColorsToLuminanceGroupAction: (groupId, entries) => {
      const project = get().project;
      if (!project) return;
      const result = importColorsToLuminanceGroup(project.luminancePalette, groupId, entries);
      if (!result.ok) {
        if (result.reason === "group_full") toast.info("导入后超过 10 色上限");
        return;
      }
      set({ project: { ...project, luminancePalette: result.palette } });
    },

    createLuminanceGroupFromSelection: () => {
      const { project, selection } = get();
      if (!project) {
        toast.info("请先打开项目");
        return;
      }
      if (!selection || isSelectionEmpty(selection)) {
        toast.info("请先创建选区");
        return;
      }

      const grid = getActiveLayerProjectedSurfaceFromProject(project);
      const group = createGroupFromSelectionColors(
        grid,
        selection,
        project.luminancePalette.groups.length + 1,
      );
      if (!group) {
        toast.info("选区内没有可用颜色");
        return;
      }

      const nextPalette = addLuminancePaletteGroup(project.luminancePalette, group);
      set({
        project: { ...project, luminancePalette: nextPalette },
        luminancePalettePanel: { ...get().luminancePalettePanel, visible: true },
      });
      toast.info(`已从选区创建明度色板组「${group.name}」（${group.colors.length} 色）`);
    },

    pickLuminancePaletteGroupByShortcut: (key) => {
      if (!get().luminancePalettePanel.visible) return;
      const project = get().project;
      if (!project) return;

      const groupIndex = shortcutKeyToGroupIndex(key);
      if (groupIndex === null) return;

      const group = pickGroupByShortcutIndex(project.luminancePalette.groups, groupIndex);
      if (!group) return;

      const firstColor = pickFirstColorInGroup(group);

      set({
        ...(firstColor ? { foregroundColor: firstColor } : {}),
        project: updateProjectLuminancePalette(project, (palette) =>
          setLuminancePaletteActiveGroupId(palette, group.id),
        ),
      });
    },

    pickLuminancePaletteColorByShortcut: (key) => {
      if (!get().luminancePalettePanel.visible) return;
      const project = get().project;
      if (!project) return;

      const shortcutIndex = shortcutKeyToSwatchIndex(key);
      if (shortcutIndex === null) return;

      const group = resolveActiveGroup(
        project.luminancePalette.groups,
        get().foregroundColor,
        project.luminancePalette.activeGroupId,
      );
      if (!group) return;

      const color = pickColorByShortcutIndex(group, shortcutIndex);
      if (!color) return;

      set({
        foregroundColor: color,
        project: updateProjectLuminancePalette(project, (palette) =>
          setLuminancePaletteActiveGroupId(palette, group.id),
        ),
      });
    },

    navigateLuminancePaletteColor: (direction) => {
      if (!get().luminancePalettePanel.visible) return;
      const project = get().project;
      if (!project) return;

      const foregroundColor = get().foregroundColor;
      const group = resolveActiveGroup(
        project.luminancePalette.groups,
        foregroundColor,
        project.luminancePalette.activeGroupId,
      );
      if (!group) return;

      const nextColor = navigateGroupColor(group, foregroundColor, direction);
      if (!nextColor) return;

      set({
        foregroundColor: nextColor,
        project: updateProjectLuminancePalette(project, (palette) =>
          setLuminancePaletteActiveGroupId(palette, group.id),
        ),
      });
    },

    replaceProjectLuminancePalette: (data) => {
      const project = get().project;
      if (!project) return;
      set({
        project: {
          ...project,
          luminancePalette: replaceLuminancePaletteData(project.luminancePalette, data),
        },
      });
    },
  };
}

export function syncLuminanceLiveEditFromColorPicker(
  get: () => {
    luminancePalettePanel: LuminancePalettePanelState;
    project: Project | null;
  },
  set: LuminancePaletteSet,
  color: PixelColor,
): void {
  const { luminancePalettePanel, project } = get();
  if (!luminancePalettePanel.visible || !luminancePalettePanel.liveEditTarget || !project) {
    return;
  }

  const { groupId, swatchIndex } = luminancePalettePanel.liveEditTarget;
  if (isVirtualTrailingEmptyGroup(groupId)) return;

  const group = project.luminancePalette.groups.find((item) => item.id === groupId);
  const currentSwatch = group?.colors[swatchIndex];
  if (currentSwatch && colorsEqual(currentSwatch.color, color)) {
    return;
  }

  const result = replaceLuminanceSwatchColorLive(
    project.luminancePalette,
    groupId,
    swatchIndex,
    color,
  );
  if (!result.ok) return;

  set((state) => {
    if (!state.project) return {};
    return {
      project: { ...state.project, luminancePalette: result.palette },
    };
  });
}
