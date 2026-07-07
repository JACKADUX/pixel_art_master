import { pushHistory, pushStructureHistory } from "@/application/use-cases/HistoryUseCases";
import { getActiveLayer } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import type { LayerPosition } from "@/domain/layer/Layer";
import {
  beginMoveSelection,
  cancelFloatingSelection,
  commitFloatingSelection,
  commitFloatingSelectionInProject,
  createSelectionFromDrag,
  createSelectionFromLasso,
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
import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";
import {
  hitTestTransformHandle,
  type TransformHandle,
} from "@/infrastructure/canvas/SelectionOverlayRenderer";

export interface DeferredCreateDrag {
  start: Point;
  lassoPoints: Point[];
}

/** 框选创建时按住空格整体偏移的基准状态 */
export interface CreateOffsetDrag {
  anchor: Point;
  baseStart: Point;
  baseCurrent: Point;
  baseLassoPoints: Point[];
}

export interface SelectionDragState {
  start: Point;
  current: Point;
  mode: "create" | "move" | "transform" | "layerPosition";
  transformHandle?: TransformHandle;
  initialBounds?: SelectionRect;
  initialOffset?: Point;
  initialFloating?: FloatingSelection;
  initialScale?: { x: number; y: number };
  initialAngle?: number;
  /** 拖拽新建选区时按住空格暂存的原 marquee / 套索状态（移动已有选区） */
  deferredCreate?: DeferredCreateDrag;
  /** 框选创建时按住空格整体偏移 */
  createOffset?: CreateOffsetDrag;
  /** 无选区时平移整个绘制层位置 */
  initialPosition?: LayerPosition;
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

function hasActiveCreateDrag(
  selectionDrag: SelectionDragState,
  lassoPoints: Point[],
  settings: ToolSettings,
): boolean {
  if (settings.selectionMode === "lasso") {
    return (
      lassoPoints.length > 1 ||
      selectionDrag.start.x !== selectionDrag.current.x ||
      selectionDrag.start.y !== selectionDrag.current.y
    );
  }
  return (
    selectionDrag.start.x !== selectionDrag.current.x ||
    selectionDrag.start.y !== selectionDrag.current.y
  );
}

function resolveCreateOffsetPoints(
  createOffset: CreateOffsetDrag,
  point: Point,
): { start: Point; current: Point; lassoPoints: Point[] } {
  const dx = point.x - createOffset.anchor.x;
  const dy = point.y - createOffset.anchor.y;
  return {
    start: {
      x: createOffset.baseStart.x + dx,
      y: createOffset.baseStart.y + dy,
    },
    current: {
      x: createOffset.baseCurrent.x + dx,
      y: createOffset.baseCurrent.y + dy,
    },
    lassoPoints: createOffset.baseLassoPoints.map((p) => ({
      x: p.x + dx,
      y: p.y + dy,
    })),
  };
}

function previewRectForCreateDrag(
  start: Point,
  current: Point,
  settings: ToolSettings,
): SelectionRect | null {
  if (settings.selectionMode === "lasso") return null;
  return normalizeRect(start.x, start.y, current.x, current.y);
}

export function handleSelectPointerDown(options: {
  project: Project;
  grid: WritableCanvasSurface;
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
  grid?: WritableCanvasSurface;
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
  grid: WritableCanvasSurface;
  modifiers: ModifierKeys;
  historyStack: HistoryStack;
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState;
  lassoPoints: Point[];
  selectionPreviewRect: SelectionRect | null;
  grid?: WritableCanvasSurface;
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
    selectionDrag.createOffset &&
    !modifiers.spaceKey
  ) {
    const resolved = resolveCreateOffsetPoints(selectionDrag.createOffset, point);
    return {
      selection,
      selectionDrag: {
        start: resolved.start,
        current: point,
        mode: "create",
      },
      lassoPoints: resolved.lassoPoints,
      selectionPreviewRect: previewRectForCreateDrag(
        resolved.start,
        point,
        settings,
      ),
    };
  }

  if (
    selectionDrag.mode === "create" &&
    selectionDrag.createOffset &&
    modifiers.spaceKey
  ) {
    const resolved = resolveCreateOffsetPoints(selectionDrag.createOffset, point);
    return {
      selection,
      selectionDrag: {
        ...selectionDrag,
        start: resolved.start,
        current: resolved.current,
      },
      lassoPoints: resolved.lassoPoints,
      selectionPreviewRect: previewRectForCreateDrag(
        resolved.start,
        resolved.current,
        settings,
      ),
    };
  }

  if (
    selectionDrag.mode === "create" &&
    modifiers.spaceKey &&
    !selectionDrag.createOffset &&
    hasActiveCreateDrag(selectionDrag, lassoPoints, settings)
  ) {
    return {
      selection,
      selectionDrag: {
        ...selectionDrag,
        createOffset: {
          anchor: point,
          baseStart: { ...selectionDrag.start },
          baseCurrent: { ...selectionDrag.current },
          baseLassoPoints: [...lassoPoints],
        },
      },
      lassoPoints,
      selectionPreviewRect: previewRectForCreateDrag(
        selectionDrag.start,
        selectionDrag.current,
        settings,
      ),
    };
  }

  if (
    selectionDrag.mode === "create" &&
    modifiers.spaceKey &&
    !selectionDrag.createOffset &&
    !hasActiveCreateDrag(selectionDrag, lassoPoints, settings) &&
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

    return {
      selection,
      selectionDrag: { ...selectionDrag, current: point },
      lassoPoints,
      selectionPreviewRect: null,
    };
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
  grid: WritableCanvasSurface;
}): {
  selection: SelectionState | null;
  selectionDrag: null;
  lassoPoints: Point[];
  selectionPreviewRect: null;
  grid?: WritableCanvasSurface;
  project?: Project;
} {
  const {
    project,
    point,
    settings,
    selection,
    selectionDrag,
    lassoPoints,
    modifiers,
    historyStack,
  } = options;
  const size = getCanvasSize(project);

  let effectiveDrag = selectionDrag;
  let effectiveLasso = lassoPoints;
  if (selectionDrag?.mode === "create" && selectionDrag.createOffset) {
    const resolved = resolveCreateOffsetPoints(selectionDrag.createOffset, point);
    effectiveDrag = {
      ...selectionDrag,
      start: resolved.start,
      current: resolved.current,
    };
    effectiveLasso = resolved.lassoPoints;
  }

  if (!effectiveDrag) {
    return {
      selection,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  if (effectiveDrag.mode === "move") {
    return {
      selection,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  const dragged =
    effectiveDrag.start.x !== point.x || effectiveDrag.start.y !== point.y;
  if (!dragged) {
    const keepSelection =
      selection && isPointInSelection(selection, point);
    if (!keepSelection && selection?.floating) {
      const { project: committedProject } = commitFloatingSelectionInProject(
        project,
        selection,
      );
      return {
        project: committedProject,
        selection: null,
        selectionDrag: null,
        lassoPoints: [],
        selectionPreviewRect: null,
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

  let workingProject = project;
  let existingSelection = selection;
  let projectChanged = false;
  if (selection?.floating) {
    const committed = commitFloatingSelectionInProject(project, selection);
    workingProject = committed.project;
    existingSelection = committed.selection;
    projectChanged = true;
  }

  if (settings.selectionMode === "lasso") {
    const points =
      effectiveLasso.length > 0 && shouldAppendLassoPoint(effectiveLasso, point)
        ? [...effectiveLasso, point]
        : effectiveLasso;
    const next = createSelectionFromLasso(
      points,
      size.width,
      size.height,
      existingSelection,
      modifiers.shiftKey,
      modifiers.altKey,
    );
    return {
      project: projectChanged ? workingProject : undefined,
      selection: next,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  const next = createSelectionFromDrag(
    effectiveDrag.start,
    point,
    size.width,
    size.height,
    settings,
    existingSelection,
    modifiers.shiftKey,
    modifiers.altKey,
  );

  return {
    project: projectChanged ? workingProject : undefined,
    selection: next,
    selectionDrag: null,
    lassoPoints: [],
    selectionPreviewRect: null,
  };
}

export function handleTransformPointerDown(options: {
  project: Project;
  grid: WritableCanvasSurface;
  point: Point;
  selection: SelectionState | null;
  historyStack: HistoryStack;
  transformMode: ToolSettings["transformMode"];
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
  grid?: WritableCanvasSurface;
} {
  const { project, grid, point, selection, historyStack, transformMode } = options;

  if (!selection || isSelectionEmpty(selection)) {
    if (transformMode !== "move") {
      return { selection, selectionDrag: null };
    }
    const activeLayer = getActiveLayer(project);
    if (!isDrawingLayer(activeLayer) || activeLayer.locked) {
      return { selection, selectionDrag: null };
    }
    pushStructureHistory(historyStack, project, selection);
    return {
      selection,
      selectionDrag: {
        start: point,
        current: point,
        mode: "layerPosition",
        initialPosition: { ...activeLayer.position },
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
  grid: WritableCanvasSurface;
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

export function resolveLayerPositionFromDrag(
  selectionDrag: SelectionDragState,
  point: Point,
): LayerPosition | null {
  if (selectionDrag.mode !== "layerPosition" || !selectionDrag.initialPosition) {
    return null;
  }
  const dx = point.x - selectionDrag.start.x;
  const dy = point.y - selectionDrag.start.y;
  return {
    x: selectionDrag.initialPosition.x + dx,
    y: selectionDrag.initialPosition.y + dy,
  };
}

export function handleTransformPointerUp(options: {
  grid: WritableCanvasSurface;
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
}): {
  selection: SelectionState | null;
  selectionDrag: null;
  grid?: WritableCanvasSurface;
} {
  const { selection, selectionDrag } = options;

  if (!selectionDrag) {
    return { selection, selectionDrag: null };
  }

  return { selection, selectionDrag: null };
}

export function commitActiveFloating(options: {
  grid: WritableCanvasSurface;
  selection: SelectionState | null;
}): { grid: WritableCanvasSurface; selection: SelectionState | null } {
  if (!options.selection?.floating) {
    return { grid: options.grid, selection: options.selection };
  }
  return commitFloatingSelection(options.grid, options.selection);
}

export function cancelActiveFloating(options: {
  grid: WritableCanvasSurface;
  selection: SelectionState | null;
}): { grid: WritableCanvasSurface; selection: SelectionState | null } {
  if (!options.selection?.floating) {
    return { grid: options.grid, selection: options.selection };
  }
  return cancelFloatingSelection(options.grid, options.selection);
}

export { rotateFloatingSelection90, flipFloatingHorizontal, flipFloatingVertical };
