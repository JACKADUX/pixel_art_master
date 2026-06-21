import { pushHistory } from "@/application/use-cases/HistoryUseCases";
import {
  beginMoveSelection,
  cancelFloatingSelection,
  commitFloatingSelection,
  createSelectionFromDrag,
  createSelectionFromLasso,
  createSelectionFromLayerContent,
  createSelectionFromMagicWand,
  isPointInSelection,
} from "@/application/use-cases/SelectionUseCases";
import {
  ensureFloatingForTransform,
  flipFloatingHorizontal,
  flipFloatingVertical,
  rotateFloatingSelection90,
  resizeFloatingSelectionByHandle,
  rotateFloatingSelection,
} from "@/application/use-cases/TransformUseCases";
import type { HistoryStack } from "@/domain/history/HistoryStack";
import type { Project } from "@/domain/project/Project";
import { getCanvasSize } from "@/domain/project/Project";
import { normalizeRect, type SelectionRect } from "@/domain/selection/SelectionRect";
import type { FloatingSelection } from "@/domain/selection/FloatingSelection";
import { cloneFloatingSelection } from "@/domain/selection/FloatingSelection";
import { syncMaskWithFloating } from "@/domain/selection/FloatingSelectionLifecycle";
import type { SelectionState } from "@/domain/selection/SelectionState";
import {
  getEffectiveBounds,
  isSelectionEmpty,
} from "@/domain/selection/SelectionState";
import type { ResizeHandle } from "@/domain/selection/ResizeTransform";
import { shouldAppendLassoPoint } from "@/domain/selection/LassoRasterize";
import type { Point } from "@/domain/tool/ITool";
import type { ToolSettings } from "@/domain/tool/ToolType";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";
import {
  hitTestTransformHandle,
  type TransformHandle,
} from "@/infrastructure/canvas/SelectionOverlayRenderer";

export interface DeferredCreateDrag {
  start: Point;
  lassoPoints: Point[];
}

export interface SelectionDragState {
  start: Point;
  current: Point;
  mode: "create" | "move" | "transform";
  transformHandle?: TransformHandle;
  initialBounds?: SelectionRect;
  initialOffset?: Point;
  initialFloating?: FloatingSelection;
  initialScale?: { x: number; y: number };
  initialAngle?: number;
  /** 拖拽新建选区时按住空格暂存的原 marquee / 套索状态 */
  deferredCreate?: DeferredCreateDrag;
  /** 无选区时平移整个图层，不显示变换框 */
  layerPan?: boolean;
}

export interface ModifierKeys {
  shiftKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
}

function canSpaceMoveSelection(
  selection: SelectionState | null,
): selection is SelectionState {
  return selection !== null && !isSelectionEmpty(selection);
}

export function handleSelectPointerDown(options: {
  project: Project;
  grid: PixelGrid;
  point: Point;
  settings: ToolSettings;
  selection: SelectionState | null;
  modifiers: ModifierKeys;
  historyStack: HistoryStack;
  getReferencePixelCache?: (
    layerId: string,
    cropKey: string,
  ) => ReferenceLayerPixelData | null;
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
  lassoPoints: Point[];
  selectionPreviewRect: SelectionRect | null;
  grid?: PixelGrid;
  pushHistory?: boolean;
} {
  const {
    project,
    grid,
    point,
    settings,
    selection,
    modifiers,
    historyStack,
    getReferencePixelCache,
  } = options;

  if (settings.selectionMode === "magicWand") {
    pushHistory(historyStack, project, selection);
    const next = createSelectionFromMagicWand(
      grid,
      point,
      settings,
      selection,
      modifiers.shiftKey,
      modifiers.altKey,
      project,
      getReferencePixelCache,
    );
    return {
      selection: next,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      pushHistory: false,
    };
  }

  if (selection && isPointInSelection(selection, point) && !modifiers.shiftKey && !modifiers.altKey) {
    pushHistory(historyStack, project, selection);
    if (selection.floating) {
      return {
        selection,
        selectionDrag: {
          start: point,
          current: point,
          mode: "move",
          initialOffset: { ...selection.floating.offset },
        },
        lassoPoints: [],
        selectionPreviewRect: null,
        pushHistory: false,
      };
    }
    const floated = beginMoveSelection(grid, selection);
    return {
      selection: floated,
      grid,
      selectionDrag: {
        start: point,
        current: point,
        mode: "move",
        initialOffset: floated.floating
          ? { ...floated.floating.offset }
          : undefined,
      },
      lassoPoints: [],
      selectionPreviewRect: null,
      pushHistory: false,
    };
  }

  if (settings.selectionMode === "lasso") {
    return {
      selection,
      selectionDrag: { start: point, current: point, mode: "create" },
      lassoPoints: [point],
      selectionPreviewRect: null,
    };
  }

  return {
    selection,
    selectionDrag: { start: point, current: point, mode: "create" },
    lassoPoints: [],
    selectionPreviewRect: null,
  };
}

export function handleSelectPointerMove(options: {
  project: Project;
  point: Point;
  settings: ToolSettings;
  selection: SelectionState | null;
  selectionDrag: SelectionDragState;
  lassoPoints: Point[];
  grid: PixelGrid;
  modifiers: ModifierKeys;
  historyStack: HistoryStack;
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState;
  lassoPoints: Point[];
  selectionPreviewRect: SelectionRect | null;
  grid?: PixelGrid;
} {
  const {
    project,
    point,
    settings,
    selection,
    selectionDrag,
    lassoPoints,
    grid,
    modifiers,
    historyStack,
  } = options;

  if (
    selectionDrag.mode === "create" &&
    modifiers.spaceKey &&
    canSpaceMoveSelection(selection)
  ) {
    pushHistory(historyStack, project, selection);
    let effectiveSelection = selection;
    let gridChanged = false;
    if (!selection.floating) {
      effectiveSelection = beginMoveSelection(grid, selection);
      gridChanged = true;
    }
    const anchor = selectionDrag.current;
    return {
      selection: effectiveSelection,
      ...(gridChanged ? { grid } : {}),
      selectionDrag: {
        start: anchor,
        current: anchor,
        mode: "move",
        initialOffset: effectiveSelection.floating
          ? { ...effectiveSelection.floating.offset }
          : undefined,
        deferredCreate: {
          start: selectionDrag.start,
          lassoPoints: [...lassoPoints],
        },
      },
      lassoPoints,
      selectionPreviewRect: null,
    };
  }

  if (
    selectionDrag.mode === "move" &&
    selectionDrag.deferredCreate &&
    !modifiers.spaceKey
  ) {
    const deferred = selectionDrag.deferredCreate;
    return {
      selection,
      selectionDrag: {
        start: deferred.start,
        current: point,
        mode: "create",
      },
      lassoPoints: [...deferred.lassoPoints],
      selectionPreviewRect:
        settings.selectionMode === "lasso"
          ? null
          : normalizeRect(deferred.start.x, deferred.start.y, point.x, point.y),
    };
  }

  if (selectionDrag.mode === "move") {
    const dx = point.x - selectionDrag.start.x;
    const dy = point.y - selectionDrag.start.y;

    if (selection?.floating) {
      const initialOffset = selectionDrag.initialOffset ?? selection.floating.offset;
      const updated = syncMaskWithFloating({
        ...selection,
        floating: {
          ...selection.floating,
          offset: {
            x: initialOffset.x + dx,
            y: initialOffset.y + dy,
          },
        },
      });
      return {
        selection: updated,
        selectionDrag: { ...selectionDrag, current: point },
        lassoPoints,
        selectionPreviewRect: null,
      };
    }
  }

  if (settings.selectionMode === "lasso") {
    const nextPoints = [...lassoPoints];
    if (shouldAppendLassoPoint(nextPoints, point)) {
      nextPoints.push(point);
    }
    return {
      selection,
      selectionDrag: { ...selectionDrag, current: point },
      lassoPoints: nextPoints,
      selectionPreviewRect: null,
    };
  }

  return {
    selection,
    selectionDrag: { ...selectionDrag, current: point },
    lassoPoints,
    selectionPreviewRect: normalizeRect(
      selectionDrag.start.x,
      selectionDrag.start.y,
      point.x,
      point.y,
    ),
  };
}

export function handleSelectPointerUp(options: {
  project: Project;
  point: Point;
  settings: ToolSettings;
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
  lassoPoints: Point[];
  modifiers: ModifierKeys;
  historyStack: HistoryStack;
  grid: PixelGrid;
}): {
  selection: SelectionState | null;
  selectionDrag: null;
  lassoPoints: Point[];
  selectionPreviewRect: null;
  grid?: PixelGrid;
} {
  const {
    project,
    point,
    settings,
    selection,
    selectionDrag,
    lassoPoints,
    grid,
    modifiers,
    historyStack,
  } = options;
  const size = getCanvasSize(project);

  if (!selectionDrag) {
    return {
      selection,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  if (selectionDrag.mode === "move") {
    return {
      selection,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  const dragged =
    selectionDrag.start.x !== point.x || selectionDrag.start.y !== point.y;
  if (!dragged) {
    const keepSelection =
      selection && isPointInSelection(selection, point);
    if (!keepSelection && selection?.floating) {
      const { grid: committedGrid } = commitFloatingSelection(grid, selection);
      return {
        selection: null,
        selectionDrag: null,
        lassoPoints: [],
        selectionPreviewRect: null,
        grid: committedGrid,
      };
    }
    return {
      selection: keepSelection ? selection : null,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  pushHistory(historyStack, project, selection);

  let workingGrid = grid;
  let existingSelection = selection;
  let gridChanged = false;
  if (selection?.floating) {
    const committed = commitFloatingSelection(grid, selection);
    workingGrid = committed.grid;
    existingSelection = committed.selection;
    gridChanged = true;
  }

  if (settings.selectionMode === "lasso") {
    const points =
      lassoPoints.length > 0 && shouldAppendLassoPoint(lassoPoints, point)
        ? [...lassoPoints, point]
        : lassoPoints;
    const next = createSelectionFromLasso(
      points,
      size.width,
      size.height,
      existingSelection,
      modifiers.shiftKey,
      modifiers.altKey,
    );
    return {
      selection: next,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      ...(gridChanged ? { grid: workingGrid } : {}),
    };
  }

  const next = createSelectionFromDrag(
    selectionDrag.start,
    point,
    size.width,
    size.height,
    settings,
    existingSelection,
    modifiers.shiftKey,
    modifiers.altKey,
  );

  return {
    selection: next,
    selectionDrag: null,
    lassoPoints: [],
    selectionPreviewRect: null,
    ...(gridChanged ? { grid: workingGrid } : {}),
  };
}

export function handleTransformPointerDown(options: {
  project: Project;
  grid: PixelGrid;
  point: Point;
  selection: SelectionState | null;
  historyStack: HistoryStack;
  transformMode: ToolSettings["transformMode"];
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
  grid?: PixelGrid;
} {
  const { project, grid, point, selection, historyStack, transformMode } = options;

  if (!selection || isSelectionEmpty(selection)) {
    if (transformMode !== "move") {
      return { selection, selectionDrag: null };
    }
    const layerSelection = createSelectionFromLayerContent(grid);
    if (!layerSelection) {
      return { selection, selectionDrag: null };
    }
    pushHistory(historyStack, project, selection);
    const withFloating = beginMoveSelection(grid, layerSelection);
    if (!withFloating.floating) {
      return { selection, selectionDrag: null };
    }
    return {
      selection: withFloating,
      grid,
      selectionDrag: {
        start: point,
        current: point,
        mode: "transform",
        transformHandle: "move",
        layerPan: true,
        initialOffset: { ...withFloating.floating.offset },
        initialFloating: cloneFloatingSelection(withFloating.floating),
      },
    };
  }

  const handle = hitTestTransformHandle(point, selection, 1);
  if (!handle) {
    return { selection, selectionDrag: null };
  }

  pushHistory(historyStack, project, selection);
  const withFloating = ensureFloatingForTransform(grid, selection);
  const initialBounds = getEffectiveBounds(withFloating);

  return {
    selection: withFloating,
    selectionDrag: {
      start: point,
      current: point,
      mode: "transform",
      transformHandle: handle,
      initialBounds,
      initialOffset: withFloating.floating
        ? { ...withFloating.floating.offset }
        : undefined,
      initialFloating: withFloating.floating
        ? cloneFloatingSelection(withFloating.floating)
        : undefined,
    },
    grid: withFloating !== selection ? grid : undefined,
  };
}

export function handleTransformPointerMove(options: {
  point: Point;
  selection: SelectionState;
  selectionDrag: SelectionDragState;
  grid: PixelGrid;
  shiftKey: boolean;
  altKey: boolean;
}): { selection: SelectionState; selectionDrag: SelectionDragState } {
  const { point, selection, selectionDrag, shiftKey, altKey } = options;
  const handle = selectionDrag.transformHandle ?? "move";
  const dx = point.x - selectionDrag.start.x;
  const dy = point.y - selectionDrag.start.y;

  if (handle === "move" && selection.floating) {
    const initialOffset = selectionDrag.initialOffset ?? selection.floating.offset;
    const updated = syncMaskWithFloating({
      ...selection,
      floating: {
        ...selection.floating,
        offset: {
          x: initialOffset.x + dx,
          y: initialOffset.y + dy,
        },
      },
    });
    return {
      selection: updated,
      selectionDrag: { ...selectionDrag, current: point },
    };
  }

  const initialFloating = selectionDrag.initialFloating;
  if (!initialFloating) {
    return { selection, selectionDrag: { ...selectionDrag, current: point } };
  }

  if (handle === "rotate") {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    const snapped = shiftKey ? Math.round(angle / 15) * 15 : angle;
    const rotatedPixels = rotateFloatingSelection(
      { ...selection, floating: initialFloating },
      snapped,
    ).floating!.pixels;
    const initialOffset = selectionDrag.initialOffset ?? initialFloating.offset;
    return {
      selection: syncMaskWithFloating({
        ...selection,
        floating: {
          pixels: rotatedPixels,
          offset: initialOffset,
          originInLayer: initialFloating.originInLayer,
          source: initialFloating.source,
        },
      }),
      selectionDrag: { ...selectionDrag, current: point },
    };
  }

  const resized = resizeFloatingSelectionByHandle(
    selection,
    handle as ResizeHandle,
    point,
    initialFloating,
    { shiftKey, altKey },
  );

  return {
    selection: resized,
    selectionDrag: { ...selectionDrag, current: point },
  };
}

export function handleTransformPointerUp(options: {
  grid: PixelGrid;
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
}): {
  selection: SelectionState | null;
  selectionDrag: null;
  grid?: PixelGrid;
} {
  const { grid, selection, selectionDrag } = options;

  if (!selectionDrag) {
    return { selection, selectionDrag: null };
  }

  if (selectionDrag.layerPan && selection?.floating) {
    const { grid: committedGrid } = commitFloatingSelection(grid, selection);
    return {
      selection: null,
      selectionDrag: null,
      grid: committedGrid,
    };
  }

  return { selection, selectionDrag: null };
}

export function commitActiveFloating(options: {
  grid: PixelGrid;
  selection: SelectionState | null;
}): { grid: PixelGrid; selection: SelectionState | null } {
  if (!options.selection?.floating) {
    return { grid: options.grid, selection: options.selection };
  }
  return commitFloatingSelection(options.grid, options.selection);
}

export function cancelActiveFloating(options: {
  grid: PixelGrid;
  selection: SelectionState | null;
}): { grid: PixelGrid; selection: SelectionState | null } {
  if (!options.selection?.floating) {
    return { grid: options.grid, selection: options.selection };
  }
  return cancelFloatingSelection(options.grid, options.selection);
}

export { rotateFloatingSelection90, flipFloatingHorizontal, flipFloatingVertical };
