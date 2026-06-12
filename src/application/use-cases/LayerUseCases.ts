import type { PixelGrid } from "@/domain/canvas/PixelGrid";

import {

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

  const updatedLayer = syncLayerPixels(activeLayer, grid);

  const layers = project.canvas.layers.map((l) =>

    l.id === activeLayer.id ? updatedLayer : l,

  );

  return touchProject(withLayers(project, layers));

}



export function getActiveLayerGridFromProject(project: Project): PixelGrid {

  const activeLayer = getActiveLayer(project);

  return getLayerGrid(activeLayer, getCanvasSize(project));

}


