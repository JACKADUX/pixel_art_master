import { pushHistory } from "@/application/use-cases/HistoryUseCases";
import {
  beginMoveSelection,
  cancelFloatingSelection,
  commitFloatingSelection,
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
  scaleFloatingSelection,
  rotateFloatingSelection,
} from "@/application/use-cases/TransformUseCases";
import type { HistoryStack } from "@/domain/history/HistoryStack";
import type { Project } from "@/domain/project/Project";
import { getCanvasSize } from "@/domain/project/Project";
import { normalizeRect, type SelectionRect } from "@/domain/selection/SelectionRect";
import type { FloatingSelection } from "@/domain/selection/FloatingSelection";
import { cloneFloatingSelection } from "@/domain/selection/FloatingSelection";
import type { SelectionState } from "@/domain/selection/SelectionState";
import { isSelectionEmpty } from "@/domain/selection/SelectionState";
import { shouldAppendLassoPoint } from "@/domain/selection/LassoRasterize";
import type { Point } from "@/domain/tool/ITool";
import type { ToolSettings } from "@/domain/tool/ToolType";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  hitTestTransformHandle,
  type TransformHandle,
} from "@/infrastructure/canvas/SelectionOverlayRenderer";

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
}

export interface ModifierKeys {
  shiftKey: boolean;
  altKey: boolean;
}

export function handleSelectPointerDown(options: {
  project: Project;
  grid: PixelGrid;
  point: Point;
  settings: ToolSettings;
  selection: SelectionState | null;
  modifiers: ModifierKeys;
  historyStack: HistoryStack;
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
  lassoPoints: Point[];
  selectionPreviewRect: SelectionRect | null;
  grid?: PixelGrid;
  pushHistory?: boolean;
} {
  const { project, grid, point, settings, selection, modifiers, historyStack } = options;

  if (settings.selectionMode === "magicWand") {
    pushHistory(historyStack, project, selection);
    const next = createSelectionFromMagicWand(
      grid,
      point,
      settings,
      selection,
      modifiers.shiftKey,
      modifiers.altKey,
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
    const withFloating = beginMoveSelection(grid, selection);
    const initialOffset = withFloating.floating
      ? { ...withFloating.floating.offset }
      : { x: 0, y: 0 };
    return {
      selection: withFloating,
      selectionDrag: {
        start: point,
        current: point,
        mode: "move",
        initialOffset,
      },
      lassoPoints: [],
      selectionPreviewRect: null,
      grid,
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
    selectionPreviewRect: normalizeRect(point.x, point.y, point.x, point.y),
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
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState;
  lassoPoints: Point[];
  selectionPreviewRect: SelectionRect | null;
  grid?: PixelGrid;
} {
  const { point, settings, selection, selectionDrag, lassoPoints } = options;

  if (selectionDrag.mode === "move" && selection?.floating) {
    const dx = point.x - selectionDrag.start.x;
    const dy = point.y - selectionDrag.start.y;
    const initialOffset = selectionDrag.initialOffset ?? selection.floating.offset;
    return {
      selection: {
        ...selection,
        floating: {
          ...selection.floating,
          offset: {
            x: initialOffset.x + dx,
            y: initialOffset.y + dy,
          },
        },
      },
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

  pushHistory(historyStack, project, selection);

  if (settings.selectionMode === "lasso") {
    const points =
      lassoPoints.length > 0 && shouldAppendLassoPoint(lassoPoints, point)
        ? [...lassoPoints, point]
        : lassoPoints;
    const next = createSelectionFromLasso(
      points,
      size.width,
      size.height,
      selection,
      modifiers.shiftKey,
      modifiers.altKey,
    );
    return {
      selection: next,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    };
  }

  const next = createSelectionFromDrag(
    selectionDrag.start,
    point,
    size.width,
    size.height,
    settings,
    selection,
    modifiers.shiftKey,
    modifiers.altKey,
  );

  return {
    selection: next,
    selectionDrag: null,
    lassoPoints: [],
    selectionPreviewRect: null,
  };
}

export function handleTransformPointerDown(options: {
  project: Project;
  grid: PixelGrid;
  point: Point;
  selection: SelectionState | null;
  historyStack: HistoryStack;
}): {
  selection: SelectionState | null;
  selectionDrag: SelectionDragState | null;
  grid?: PixelGrid;
} {
  const { project, grid, point, selection, historyStack } = options;
  if (!selection || isSelectionEmpty(selection)) {
    return { selection, selectionDrag: null };
  }

  const handle = hitTestTransformHandle(point, selection, 1);
  if (!handle) {
    return { selection, selectionDrag: null };
  }

  pushHistory(historyStack, project, selection);
  const withFloating = ensureFloatingForTransform(grid, selection);

  return {
    selection: withFloating,
    selectionDrag: {
      start: point,
      current: point,
      mode: "transform",
      transformHandle: handle,
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
}): { selection: SelectionState; selectionDrag: SelectionDragState } {
  const { point, selection, selectionDrag, shiftKey } = options;
  const handle = selectionDrag.transformHandle ?? "move";
  const dx = point.x - selectionDrag.start.x;
  const dy = point.y - selectionDrag.start.y;

  if (handle === "move" && selection.floating) {
    const initialOffset = selectionDrag.initialOffset ?? selection.floating.offset;
    return {
      selection: {
        ...selection,
        floating: {
          ...selection.floating,
          offset: {
            x: initialOffset.x + dx,
            y: initialOffset.y + dy,
          },
        },
      },
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
      selection: {
        ...selection,
        floating: {
          pixels: rotatedPixels,
          offset: initialOffset,
          originInLayer: initialFloating.originInLayer,
        },
      },
      selectionDrag: { ...selectionDrag, current: point },
    };
  }

  const bounds = initialFloating.pixels;
  let scaleX = 1;
  let scaleY = 1;

  if (handle.includes("right")) scaleX = Math.max(0.1, 1 + dx / bounds.width);
  if (handle.includes("left")) scaleX = Math.max(0.1, 1 - dx / bounds.width);
  if (handle.includes("bottom")) scaleY = Math.max(0.1, 1 + dy / bounds.height);
  if (handle.includes("top")) scaleY = Math.max(0.1, 1 - dy / bounds.height);

  if (shiftKey) {
    const uniform = Math.max(scaleX, scaleY);
    scaleX = uniform;
    scaleY = uniform;
  }

  const scaled = scaleFloatingSelection(
    { ...selection, floating: initialFloating },
    scaleX,
    scaleY,
  );

  return {
    selection: scaled,
    selectionDrag: { ...selectionDrag, current: point },
  };
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
