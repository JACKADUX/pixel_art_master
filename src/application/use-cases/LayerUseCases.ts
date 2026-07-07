import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  wrapLayerOnCanvas,
  type LayerProjectedSurface,
} from "@/domain/canvas/LayerProjectedSurface";
import { isDrawingLayer, isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  createDrawingLayerClipboard,
  toPastedLayer,
  type DrawingLayerClipboard,
} from "@/domain/layer/DrawingLayerClipboard";
import { mergeDrawingLayerDown } from "@/domain/layer/DrawingLayerMerge";
import {
  addReferenceLayerToProject,
  addDrawingLayerToProject,
  getActiveCanvas,
  getActiveLayer,
  getCanvasSize,
  getLayerById,
  resolveProjectCanvas,
  touchProject,
  withActiveLayerId,
  withActiveReferenceLayerId,
  withLayers,
  type Project,
} from "@/domain/project/Project";
import { updatePixelCanvasOnBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";
import {
  canRemoveLayer,
  getLayerGrid,
  isDrawingLayerEditable,
  removeLayer,
  renameLayer,
  reorderLayer,
  resolveActiveLayerAfterRemoval,
  resolveActiveReferenceLayerAfterRemoval,
  setDrawingLayerOpacity,
  syncLayerPixels,
  toggleDrawingLayerLock,
  toggleLayerVisibility,
} from "@/domain/layer/LayerOperations";
import {
  expandDrawingLayerToCoverCanvas,
  expandDrawingLayerToIncludeCanvasPoints,
} from "@/domain/layer/DrawingLayerOperations";
import {
  getFloatingRestoreCanvasCornerPoints,
  getFloatingSelectionCanvasCornerPoints,
} from "@/domain/selection/FloatingSelectionGeometry";
import type { SelectionState } from "@/domain/selection/SelectionState";
import type { Point } from "@/domain/tool/ITool";
import { moveDrawingLayerByDeltaInProject, moveDrawingLayerInProject } from "./MoveDrawingLayer";
import {
  moveReferenceLayerByDeltaInProject,
  moveReferenceLayerInProject,
} from "./MoveReferenceLayer";
import { toggleReferenceLayerGridInProject } from "./ToggleReferenceLayerGrid";
import { toggleReferenceLayerPaletteInProject } from "./ToggleReferenceLayerPalette";
import { updateReferenceLayerCropInProject } from "./UpdateReferenceLayerCrop";
import {
  resetReferenceScaleInProject,
  scaleReferenceLayerInProject,
} from "./ScaleReferenceLayer";
import type { CropRect, Layer, LayerPosition } from "@/domain/layer/Layer";

function getActiveCanvasLayers(project: Project) {
  return getActiveCanvas(project).layers;
}

function updateActiveCanvasLayers(
  project: Project,
  layers: ReturnType<typeof getActiveCanvasLayers>,
  patch?: Partial<{
    activeLayerId: string;
  }>,
): Project {
  const canvas = getActiveCanvas(project);
  return touchProject({
    ...project,
    board: updatePixelCanvasOnBoard(project.board, canvas.id, {
      layers,
      ...patch,
    }),
  });
}

function getProjectLayerStack(project: Project): Layer[] {
  return [...project.referenceLayers, ...getActiveCanvasLayers(project)];
}

export function setActiveLayer(project: Project, layerId: string): Project {
  const layer = getLayerById(project, layerId);
  if (!layer || !isDrawingLayer(layer)) return project;
  return touchProject(withActiveLayerId(project, layerId));
}

export function setActiveReferenceLayer(project: Project, layerId: string): Project {
  const layer = getLayerById(project, layerId);
  if (!layer || !isReferenceLayer(layer)) return project;
  return touchProject(withActiveReferenceLayerId(project, layerId));
}

export function toggleLayerVisibilityInProject(
  project: Project,
  layerId: string,
): Project {
  if (project.referenceLayers.some((layer) => layer.id === layerId)) {
    return touchProject({
      ...project,
      referenceLayers: toggleLayerVisibility(project.referenceLayers, layerId) as typeof project.referenceLayers,
    });
  }
  const layers = toggleLayerVisibility(getActiveCanvasLayers(project), layerId);
  return updateActiveCanvasLayers(project, layers);
}

export function setDrawingLayerOpacityInProject(
  project: Project,
  layerId: string,
  opacity: number,
): Project {
  const layers = setDrawingLayerOpacity(getActiveCanvasLayers(project), layerId, opacity);
  return updateActiveCanvasLayers(project, layers);
}

export function toggleDrawingLayerLockInProject(
  project: Project,
  layerId: string,
): Project {
  const layers = toggleDrawingLayerLock(getActiveCanvasLayers(project), layerId);
  return updateActiveCanvasLayers(project, layers);
}

export function isActiveDrawingLayerEditable(project: Project): boolean {
  const activeLayer = getActiveLayer(project);
  return isDrawingLayer(activeLayer) && isDrawingLayerEditable(activeLayer);
}

export function renameLayerInProject(
  project: Project,
  layerId: string,
  name: string,
): Project {
  if (project.referenceLayers.some((layer) => layer.id === layerId)) {
    return touchProject({
      ...project,
      referenceLayers: renameLayer(project.referenceLayers, layerId, name.trim()) as typeof project.referenceLayers,
    });
  }
  const layers = renameLayer(getActiveCanvasLayers(project), layerId, name.trim());
  return updateActiveCanvasLayers(project, layers);
}

export function addDrawingLayer(project: Project, name?: string): Project {
  return addDrawingLayerToProject(project, name);
}

export function addReferenceLayer(project: Project, name?: string): Project {
  return addReferenceLayerToProject(project, name);
}

export function removeLayerFromProject(
  project: Project,
  layerId: string,
): Project | null {
  const referenceTarget = project.referenceLayers.find((layer) => layer.id === layerId);
  if (referenceTarget) {
    const referenceLayers = removeLayer(project.referenceLayers, layerId) as typeof project.referenceLayers;
    const activeReferenceLayerId = resolveActiveReferenceLayerAfterRemoval(
      project.referenceLayers,
      layerId,
      project.activeReferenceLayerId,
    );
    return touchProject({
      ...project,
      referenceLayers,
      activeReferenceLayerId,
    });
  }

  const canvas = getActiveCanvas(project);
  if (!canRemoveLayer(canvas.layers, layerId)) return null;

  const layers = removeLayer(canvas.layers, layerId);
  const activeLayerId = resolveActiveLayerAfterRemoval(
    canvas.layers,
    layerId,
    canvas.activeLayerId,
  );

  return updateActiveCanvasLayers(project, layers, { activeLayerId });
}

export function reorderLayerInProject(
  project: Project,
  fromIndex: number,
  toIndex: number,
): Project {
  const stack = getProjectLayerStack(project);
  const reordered = reorderLayer(stack, fromIndex, toIndex);
  const referenceLayers = reordered.filter(isReferenceLayer);
  const drawingLayers = reordered.filter(isDrawingLayer);
  return updateActiveCanvasLayers(
    touchProject({ ...project, referenceLayers }),
    drawingLayers,
  );
}

export function syncActiveLayerPixels(
  project: Project,
  grid: PixelGrid,
): Project {
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer) || !isDrawingLayerEditable(activeLayer)) {
    return project;
  }

  const updatedLayer = syncLayerPixels(activeLayer, grid);
  const layers = getActiveCanvasLayers(project).map((l) =>
    l.id === activeLayer.id ? updatedLayer : l,
  );

  return updateActiveCanvasLayers(project, layers);
}

export function getActiveLayerGridFromProject(project: Project): PixelGrid {
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer)) {
    throw new Error("Active layer is not a drawing layer");
  }
  return getLayerGrid(activeLayer);
}

export function getActiveLayerProjectedSurfaceFromProject(
  project: Project,
  canvasId?: string,
): LayerProjectedSurface {
  const activeLayer = getActiveLayer(project, canvasId);
  if (!isDrawingLayer(activeLayer)) {
    throw new Error("Active layer is not a drawing layer");
  }
  const grid = getLayerGrid(activeLayer);
  const targetCanvasId = canvasId ?? getActiveCanvas(project).id;
  return wrapLayerOnCanvas(grid, activeLayer.position, getCanvasSize(project, targetCanvasId));
}

export function ensureActiveLayerContainsCanvasPointsInProject(
  project: Project,
  points: readonly Point[],
  canvasId?: string,
): Project {
  const activeLayer = getActiveLayer(project, canvasId);
  if (
    !isDrawingLayer(activeLayer) ||
    points.length === 0 ||
    !isDrawingLayerEditable(activeLayer)
  ) {
    return project;
  }

  const expanded = expandDrawingLayerToIncludeCanvasPoints(activeLayer, points);
  if (expanded === activeLayer) return project;

  const layers = getActiveCanvasLayers(project).map((layer) =>
    layer.id === activeLayer.id ? expanded : layer,
  );
  return touchProject(withLayers(project, layers, canvasId));
}

export function ensureActiveLayerCoversCanvasInProject(
  project: Project,
  canvasId?: string,
): Project {
  const activeLayer = getActiveLayer(project, canvasId);
  if (!isDrawingLayer(activeLayer) || !isDrawingLayerEditable(activeLayer)) {
    return project;
  }

  const targetCanvasId = canvasId ?? getActiveCanvas(project).id;
  const expanded = expandDrawingLayerToCoverCanvas(
    activeLayer,
    getCanvasSize(project, targetCanvasId),
  );
  if (expanded === activeLayer) return project;

  const layers = getActiveCanvasLayers(project).map((layer) =>
    layer.id === activeLayer.id ? expanded : layer,
  );
  return touchProject(withLayers(project, layers, canvasId));
}

export function ensureActiveLayerContainsFloatingSelectionInProject(
  project: Project,
  selection: SelectionState | null,
): Project {
  if (!selection?.floating) return project;
  const points = getFloatingSelectionCanvasCornerPoints(selection.floating);
  if (points.length === 0) return project;
  return ensureActiveLayerContainsCanvasPointsInProject(project, points);
}

export function ensureActiveLayerContainsFloatingRestoreInProject(
  project: Project,
  selection: SelectionState | null,
): Project {
  if (!selection?.floating) return project;
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer)) return project;

  const points = getFloatingRestoreCanvasCornerPoints(
    selection.floating,
    activeLayer.position,
  );
  if (points.length === 0) return project;
  return ensureActiveLayerContainsCanvasPointsInProject(project, points);
}

export function moveDrawingLayer(
  project: Project,
  layerId: string,
  position: LayerPosition,
): Project | null {
  return moveDrawingLayerInProject(project, layerId, position);
}

export function moveDrawingLayerByDelta(
  project: Project,
  layerId: string,
  delta: LayerPosition,
): Project | null {
  return moveDrawingLayerByDeltaInProject(project, layerId, delta);
}

export function moveReferenceLayer(
  project: Project,
  layerId: string,
  position: LayerPosition,
): Project | null {
  return moveReferenceLayerInProject(project, layerId, position);
}

export function moveReferenceLayerByDelta(
  project: Project,
  layerId: string,
  delta: LayerPosition,
): Project | null {
  return moveReferenceLayerByDeltaInProject(project, layerId, delta);
}

export function setReferenceCrop(
  project: Project,
  layerId: string,
  crop: CropRect,
): Project | null {
  return updateReferenceLayerCropInProject(project, layerId, crop);
}

export function toggleReferenceGrid(
  project: Project,
  layerId: string,
): Project | null {
  return toggleReferenceLayerGridInProject(project, layerId);
}

export function toggleReferencePalette(
  project: Project,
  layerId: string,
): Project | null {
  return toggleReferenceLayerPaletteInProject(project, layerId);
}

export function scaleReferenceLayer(
  project: Project,
  layerId: string,
  scale: number,
  position?: LayerPosition,
): Project | null {
  return scaleReferenceLayerInProject(project, layerId, scale, position);
}

export function resetReferenceScale(
  project: Project,
  layerId: string,
): Project | null {
  return resetReferenceScaleInProject(project, layerId);
}

export function copyDrawingLayerInProject(
  project: Project,
  layerId: string,
  sourceCanvasId?: string,
): DrawingLayerClipboard | null {
  const canvasId = sourceCanvasId ?? getActiveCanvas(project).id;
  const layer = getLayerById(project, layerId, canvasId);
  if (!layer || !isDrawingLayer(layer)) return null;
  return createDrawingLayerClipboard(layer, canvasId);
}

export function pasteDrawingLayerInProject(
  project: Project,
  clipboard: DrawingLayerClipboard,
  canvasId?: string,
): Project {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  const canvas = resolveProjectCanvas(project, targetId) ?? getActiveCanvas(project);
  const newLayer = toPastedLayer(clipboard);
  const layers = [...canvas.layers, newLayer];

  if (targetId === getActiveCanvas(project).id) {
    return updateActiveCanvasLayers(project, layers, { activeLayerId: newLayer.id });
  }

  return touchProject({
    ...withLayers(project, layers, targetId),
    board: updatePixelCanvasOnBoard(project.board, targetId, {
      layers,
      activeLayerId: newLayer.id,
    }),
  });
}

export function mergeDrawingLayerDownInProject(
  project: Project,
  layerId: string,
  canvasId?: string,
): Project | null {
  const targetId = canvasId ?? getActiveCanvas(project).id;
  const canvas = resolveProjectCanvas(project, targetId) ?? getActiveCanvas(project);
  const result = mergeDrawingLayerDown(canvas.layers, layerId);
  if (!result) return null;

  if (targetId === getActiveCanvas(project).id) {
    return updateActiveCanvasLayers(project, result.layers, {
      activeLayerId: result.activeLayerId,
    });
  }

  return touchProject({
    ...withLayers(project, result.layers, targetId),
    board: updatePixelCanvasOnBoard(project.board, targetId, {
      layers: result.layers,
      activeLayerId: result.activeLayerId,
    }),
  });
}
