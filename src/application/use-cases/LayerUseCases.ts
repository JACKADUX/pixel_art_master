import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  wrapLayerOnCanvas,
  type LayerProjectedSurface,
} from "@/domain/canvas/LayerProjectedSurface";
import { isDrawingLayer, isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  addReferenceLayerToProject,
  addDrawingLayerToProject,
  getActiveLayer,
  getCanvasSize,
  getLayerById,
  touchProject,
  withActiveLayerId,
  withActiveReferenceLayerId,
  withLayers,
  type Project,
} from "@/domain/project/Project";
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
import type { CropRect, LayerPosition } from "@/domain/layer/Layer";

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
  const layers = toggleLayerVisibility(project.canvas.layers, layerId);
  return touchProject(withLayers(project, layers));
}

export function setDrawingLayerOpacityInProject(
  project: Project,
  layerId: string,
  opacity: number,
): Project {
  const layers = setDrawingLayerOpacity(project.canvas.layers, layerId, opacity);
  return touchProject(withLayers(project, layers));
}

export function toggleDrawingLayerLockInProject(
  project: Project,
  layerId: string,
): Project {
  const layers = toggleDrawingLayerLock(project.canvas.layers, layerId);
  return touchProject(withLayers(project, layers));
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
  const layers = renameLayer(project.canvas.layers, layerId, name.trim());
  return touchProject(withLayers(project, layers));
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
  if (!canRemoveLayer(project.canvas.layers, layerId)) return null;

  const layers = removeLayer(project.canvas.layers, layerId);
  const target = getLayerById(project, layerId);
  let activeLayerId = project.canvas.activeLayerId;
  let activeReferenceLayerId = project.canvas.activeReferenceLayerId;

  if (target?.type === "drawing") {
    activeLayerId = resolveActiveLayerAfterRemoval(
      project.canvas.layers,
      layerId,
      project.canvas.activeLayerId,
    );
  } else if (target?.type === "reference") {
    activeReferenceLayerId = resolveActiveReferenceLayerAfterRemoval(
      project.canvas.layers,
      layerId,
      project.canvas.activeReferenceLayerId,
    );
  }

  return touchProject({
    ...withLayers(project, layers),
    canvas: { ...project.canvas, layers, activeLayerId, activeReferenceLayerId },
  });
}

export function reorderLayerInProject(
  project: Project,
  fromIndex: number,
  toIndex: number,
): Project {
  const layers = reorderLayer(project.canvas.layers, fromIndex, toIndex);
  return touchProject(withLayers(project, layers));
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
  const layers = project.canvas.layers.map((l) =>
    l.id === activeLayer.id ? updatedLayer : l,
  );

  return touchProject(withLayers(project, layers));
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
): LayerProjectedSurface {
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer)) {
    throw new Error("Active layer is not a drawing layer");
  }
  const grid = getLayerGrid(activeLayer);
  return wrapLayerOnCanvas(grid, activeLayer.position, getCanvasSize(project));
}

export function ensureActiveLayerContainsCanvasPointsInProject(
  project: Project,
  points: readonly Point[],
): Project {
  const activeLayer = getActiveLayer(project);
  if (
    !isDrawingLayer(activeLayer) ||
    points.length === 0 ||
    !isDrawingLayerEditable(activeLayer)
  ) {
    return project;
  }

  const expanded = expandDrawingLayerToIncludeCanvasPoints(activeLayer, points);
  if (expanded === activeLayer) return project;

  const layers = project.canvas.layers.map((layer) =>
    layer.id === activeLayer.id ? expanded : layer,
  );
  return touchProject(withLayers(project, layers));
}

export function ensureActiveLayerCoversCanvasInProject(project: Project): Project {
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer) || !isDrawingLayerEditable(activeLayer)) {
    return project;
  }

  const expanded = expandDrawingLayerToCoverCanvas(
    activeLayer,
    getCanvasSize(project),
  );
  if (expanded === activeLayer) return project;

  const layers = project.canvas.layers.map((layer) =>
    layer.id === activeLayer.id ? expanded : layer,
  );
  return touchProject(withLayers(project, layers));
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
