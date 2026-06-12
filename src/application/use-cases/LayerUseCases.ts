import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import {
  addReferenceLayerToProject,
  addDrawingLayerToProject,
  getActiveLayer,
  getCanvasSize,
  getLayerById,
  touchProject,
  withActiveLayerId,
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
  syncLayerPixels,
  toggleLayerVisibility,
} from "@/domain/layer/LayerOperations";
import { moveReferenceLayerByDeltaInProject, moveReferenceLayerInProject } from "./MoveReferenceLayer";
import { toggleReferenceLayerGridInProject } from "./ToggleReferenceLayerGrid";
import { updateReferenceLayerCropInProject } from "./UpdateReferenceLayerCrop";
import type { CropRect, LayerPosition } from "@/domain/layer/Layer";

export function setActiveLayer(project: Project, layerId: string): Project {
  if (!getLayerById(project, layerId)) return project;
  return touchProject(withActiveLayerId(project, layerId));
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
  const activeLayerId = resolveActiveLayerAfterRemoval(
    project.canvas.layers,
    layerId,
    project.canvas.activeLayerId,
  );

  return touchProject({
    ...withLayers(project, layers),
    canvas: { ...project.canvas, layers, activeLayerId },
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
