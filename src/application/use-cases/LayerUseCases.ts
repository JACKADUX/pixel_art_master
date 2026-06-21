import type { PixelGrid } from "@/domain/canvas/PixelGrid";
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
  removeLayer,
  renameLayer,
  reorderLayer,
  resolveActiveLayerAfterRemoval,
  resolveActiveReferenceLayerAfterRemoval,
  syncLayerPixels,
  toggleLayerVisibility,
} from "@/domain/layer/LayerOperations";
import { moveReferenceLayerByDeltaInProject, moveReferenceLayerInProject } from "./MoveReferenceLayer";
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
  if (!isDrawingLayer(activeLayer)) return project;

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
  return getLayerGrid(activeLayer, getCanvasSize(project));
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
