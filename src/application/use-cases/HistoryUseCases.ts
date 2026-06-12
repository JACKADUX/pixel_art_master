import type { Project } from "@/domain/project/Project";
import { getActiveLayer, getCanvasSize } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import { syncLayerPixels, getLayerGrid } from "@/domain/layer/LayerOperations";
import { touchProject } from "@/domain/project/Project";
import {
  type EditorSnapshot,
  type HistoryStack,
  cloneEditorSnapshot,
} from "@/domain/history/HistoryStack";
import {
  cloneSelectionState,
  type SelectionState,
} from "@/domain/selection/SelectionState";

export function captureEditorSnapshot(
  project: Project,
  selection: SelectionState | null,
): EditorSnapshot | null {
  const layer = getActiveLayer(project);
  if (!isDrawingLayer(layer)) return null;

  return {
    layerId: layer.id,
    pixels: new Uint32Array(layer.pixels),
    selection: selection ? cloneSelectionState(selection) : null,
  };
}

export function pushHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): void {
  const snapshot = captureEditorSnapshot(project, selection);
  if (!snapshot) return;
  historyStack.push(snapshot);
}

export function applyEditorSnapshot(
  project: Project,
  snapshot: EditorSnapshot,
): Project {
  const layerIndex = project.canvas.layers.findIndex((l) => l.id === snapshot.layerId);
  if (layerIndex < 0) return project;

  const layer = project.canvas.layers[layerIndex];
  if (!isDrawingLayer(layer)) return project;

  const updatedLayer = {
    ...layer,
    pixels: new Uint32Array(snapshot.pixels),
  };

  const layers = [...project.canvas.layers];
  layers[layerIndex] = updatedLayer;

  return touchProject({
    ...project,
    canvas: {
      ...project.canvas,
      layers,
      activeLayerId: snapshot.layerId,
    },
  });
}

export function undoHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): { project: Project; selection: SelectionState | null } | null {
  const current = captureEditorSnapshot(project, selection);
  if (!current) return null;

  const restored = historyStack.undo(current);
  if (!restored) return null;

  return {
    project: applyEditorSnapshot(project, restored),
    selection: restored.selection,
  };
}

export function redoHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): { project: Project; selection: SelectionState | null } | null {
  const current = captureEditorSnapshot(project, selection);
  if (!current) return null;

  const restored = historyStack.redo(current);
  if (!restored) return null;

  return {
    project: applyEditorSnapshot(project, restored),
    selection: restored.selection,
  };
}

export function restoreLayerPixelsFromSnapshot(
  project: Project,
  layerId: string,
  pixels: Uint32Array,
): Project {
  const layerIndex = project.canvas.layers.findIndex((l) => l.id === layerId);
  if (layerIndex < 0) return project;

  const layer = project.canvas.layers[layerIndex];
  if (!isDrawingLayer(layer)) return project;

  const size = getCanvasSize(project);
  const grid = getLayerGrid({ ...layer, pixels: new Uint32Array(pixels) }, size);
  const updatedLayer = syncLayerPixels(layer, grid);

  const layers = [...project.canvas.layers];
  layers[layerIndex] = updatedLayer;

  return touchProject({
    ...project,
    canvas: { ...project.canvas, layers },
  });
}

export { cloneEditorSnapshot };
