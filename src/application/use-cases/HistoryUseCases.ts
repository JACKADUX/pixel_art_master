import type { Project } from "@/domain/project/Project";
import { getActiveLayer, getCanvasSize, getLayerById } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import { syncLayerPixels, getLayerGrid } from "@/domain/layer/LayerOperations";
import { cloneLayers } from "@/domain/layer/Layer";
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

export interface HistoryApplyResult {
  project: Project;
  selection: SelectionState | null;
  /** 是否为图层结构变更（增删/排序等），调用方可据此刷新结构相关缓存。 */
  structural: boolean;
}

export function captureLayerSnapshot(
  project: Project,
  layerId: string,
  selection: SelectionState | null,
): EditorSnapshot | null {
  const layer = getLayerById(project, layerId);
  if (!layer || !isDrawingLayer(layer)) return null;

  return {
    kind: "pixels",
    layerId: layer.id,
    width: layer.width,
    height: layer.height,
    position: { ...layer.position },
    pixels: new Uint32Array(layer.pixels),
    selection: selection ? cloneSelectionState(selection) : null,
  };
}

export function captureEditorSnapshot(
  project: Project,
  selection: SelectionState | null,
): EditorSnapshot | null {
  const layer = getActiveLayer(project);
  if (!isDrawingLayer(layer)) return null;
  return captureLayerSnapshot(project, layer.id, selection);
}

/** 采集整个图层结构的快照，用于撤销/重做增删图层等操作。 */
export function captureStructureSnapshot(
  project: Project,
  selection: SelectionState | null,
): EditorSnapshot {
  const canvasSize = getCanvasSize(project);
  return {
    kind: "structure",
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    layers: cloneLayers(project.canvas.layers),
    activeLayerId: project.canvas.activeLayerId,
    activeReferenceLayerId: project.canvas.activeReferenceLayerId,
    selection: selection ? cloneSelectionState(selection) : null,
  };
}

function captureCurrentForEntry(
  project: Project,
  selection: SelectionState | null,
  entry: EditorSnapshot,
): EditorSnapshot | null {
  return entry.kind === "structure"
    ? captureStructureSnapshot(project, selection)
    : captureLayerSnapshot(project, entry.layerId, selection);
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

/** 在改变图层结构（如删除图层）之前记录结构快照。 */
export function pushStructureHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): void {
  historyStack.push(captureStructureSnapshot(project, selection));
}

export function applyEditorSnapshot(
  project: Project,
  snapshot: EditorSnapshot,
): Project {
  if (snapshot.kind === "structure") {
    return applyStructureSnapshot(project, snapshot);
  }

  const layerIndex = project.canvas.layers.findIndex((l) => l.id === snapshot.layerId);
  if (layerIndex < 0) return project;

  const layer = project.canvas.layers[layerIndex];
  if (!isDrawingLayer(layer)) return project;

  const updatedLayer = {
    ...layer,
    width: snapshot.width,
    height: snapshot.height,
    position: { ...snapshot.position },
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

/** 将整个图层结构恢复为快照中的状态。 */
export function applyStructureSnapshot(
  project: Project,
  snapshot: Extract<EditorSnapshot, { kind: "structure" }>,
): Project {
  return touchProject({
    ...project,
    canvas: {
      ...project.canvas,
      width: snapshot.canvasWidth,
      height: snapshot.canvasHeight,
      layers: cloneLayers(snapshot.layers),
      activeLayerId: snapshot.activeLayerId,
      activeReferenceLayerId: snapshot.activeReferenceLayerId,
    },
  });
}

export function undoHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): HistoryApplyResult | null {
  const entry = historyStack.nextUndoEntry;
  if (!entry) return null;

  const current = captureCurrentForEntry(project, selection, entry);
  if (!current) return null;

  const restored = historyStack.undo(current);
  if (!restored) return null;

  return {
    project: applyEditorSnapshot(project, restored),
    selection: restored.selection,
    structural: restored.kind === "structure",
  };
}

export function redoHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): HistoryApplyResult | null {
  const entry = historyStack.nextRedoEntry;
  if (!entry) return null;

  const current = captureCurrentForEntry(project, selection, entry);
  if (!current) return null;

  const restored = historyStack.redo(current);
  if (!restored) return null;

  return {
    project: applyEditorSnapshot(project, restored),
    selection: restored.selection,
    structural: restored.kind === "structure",
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

  const grid = getLayerGrid({ ...layer, pixels: new Uint32Array(pixels) });
  const updatedLayer = syncLayerPixels(layer, grid);

  const layers = [...project.canvas.layers];
  layers[layerIndex] = updatedLayer;

  return touchProject({
    ...project,
    canvas: { ...project.canvas, layers },
  });
}

export { cloneEditorSnapshot };
