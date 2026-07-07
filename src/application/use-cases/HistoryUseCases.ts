import type { Project } from "@/domain/project/Project";
import {
  getActiveCanvas,
  getActiveLayer,
  getCanvasSize,
  getLayerById,
  touchProject,
  withActiveCanvasId,
  withBoard,
} from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import { syncLayerPixels, getLayerGrid } from "@/domain/layer/LayerOperations";
import { cloneLayers } from "@/domain/layer/Layer";
import {
  type EditorSnapshot,
  type HistoryStack,
  cloneEditorSnapshot,
} from "@/domain/history/HistoryStack";
import {
  cloneSelectionState,
  type SelectionState,
} from "@/domain/selection/SelectionState";
import { updatePixelCanvasOnBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";
import { clonePixelCanvases } from "@/domain/pixelCanvas/PixelCanvasClone";

export interface HistoryApplyResult {
  project: Project;
  selection: SelectionState | null;
  /** 撤销/重做后应聚焦的画板 ID */
  focusCanvasId: string | null;
  /** 是否为图层结构变更（增删/排序等），调用方可据此刷新结构相关缓存。 */
  structural: boolean;
}

export function captureLayerSnapshot(
  project: Project,
  layerId: string,
  selection: SelectionState | null,
  canvasId?: string,
): EditorSnapshot | null {
  const targetCanvasId = canvasId ?? getActiveCanvas(project).id;
  const layer = getLayerById(project, layerId, targetCanvasId);
  if (!layer || !isDrawingLayer(layer)) return null;

  return {
    kind: "pixels",
    canvasId: targetCanvasId,
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
  canvasId?: string,
): EditorSnapshot | null {
  const layer = getActiveLayer(project, canvasId);
  if (!isDrawingLayer(layer)) return null;
  const targetCanvasId = canvasId ?? getActiveCanvas(project).id;
  return captureLayerSnapshot(project, layer.id, selection, targetCanvasId);
}

export function captureStructureSnapshot(
  project: Project,
  selection: SelectionState | null,
  canvasId?: string,
): EditorSnapshot {
  const targetCanvasId = canvasId ?? getActiveCanvas(project).id;
  const canvas = getActiveCanvas(project);
  const targetCanvas = canvasId
    ? project.board.canvases.find((c) => c.id === canvasId) ?? canvas
    : canvas;
  const canvasSize = getCanvasSize(project, targetCanvasId);
  return {
    kind: "structure",
    canvasId: targetCanvasId,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    layers: cloneLayers(targetCanvas.layers.filter((layer) => isDrawingLayer(layer))),
    activeLayerId: targetCanvas.activeLayerId,
    referenceLayers: project.referenceLayers.map((layer) => ({
      ...layer,
      position: { ...layer.position },
      crop: layer.crop ? { ...layer.crop } : null,
      grid: { ...layer.grid },
    })),
    activeReferenceLayerId: project.activeReferenceLayerId,
    selection: selection ? cloneSelectionState(selection) : null,
  };
}

export function captureBoardStructureSnapshot(
  project: Project,
  selection: SelectionState | null,
): EditorSnapshot {
  return {
    kind: "board",
    canvases: clonePixelCanvases(project.board.canvases),
    activeCanvasId: project.board.activeCanvasId,
    totalCanvasCount: project.board.totalCanvasCount,
    selection: selection ? cloneSelectionState(selection) : null,
  };
}

function captureCurrentForEntry(
  project: Project,
  selection: SelectionState | null,
  entry: EditorSnapshot,
): EditorSnapshot | null {
  if (entry.kind === "board") {
    return captureBoardStructureSnapshot(project, selection);
  }
  if (entry.kind === "structure") {
    return captureStructureSnapshot(project, selection, entry.canvasId);
  }
  return captureLayerSnapshot(project, entry.layerId, selection, entry.canvasId);
}

export function pushHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
  canvasId?: string,
): void {
  const snapshot = captureEditorSnapshot(project, selection, canvasId);
  if (!snapshot) return;
  historyStack.push(snapshot);
}

export function pushStructureHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
  canvasId?: string,
): void {
  historyStack.push(captureStructureSnapshot(project, selection, canvasId));
}

export function pushBoardStructureHistory(
  historyStack: HistoryStack,
  project: Project,
  selection: SelectionState | null,
): void {
  historyStack.push(captureBoardStructureSnapshot(project, selection));
}

export function applyEditorSnapshot(
  project: Project,
  snapshot: EditorSnapshot,
): Project {
  if (snapshot.kind === "board") {
    return applyBoardStructureSnapshot(project, snapshot);
  }
  if (snapshot.kind === "structure") {
    return applyStructureSnapshot(project, snapshot);
  }

  const canvas = project.board.canvases.find((c) => c.id === snapshot.canvasId);
  if (!canvas) return project;

  const layerIndex = canvas.layers.findIndex((l) => l.id === snapshot.layerId);
  if (layerIndex < 0) return project;

  const layer = canvas.layers[layerIndex];
  if (!isDrawingLayer(layer)) return project;

  const updatedLayer = {
    ...layer,
    width: snapshot.width,
    height: snapshot.height,
    position: { ...snapshot.position },
    pixels: new Uint32Array(snapshot.pixels),
  };

  const layers = [...canvas.layers];
  layers[layerIndex] = updatedLayer;

  return touchProject({
    ...withActiveCanvasId(project, snapshot.canvasId),
    board: updatePixelCanvasOnBoard(project.board, snapshot.canvasId, {
      layers,
      activeLayerId: snapshot.layerId,
    }),
  });
}

export function applyStructureSnapshot(
  project: Project,
  snapshot: Extract<EditorSnapshot, { kind: "structure" }>,
): Project {
  return touchProject({
    ...withActiveCanvasId(project, snapshot.canvasId),
    referenceLayers: snapshot.referenceLayers.map((layer) => ({
      ...layer,
      position: { ...layer.position },
      crop: layer.crop ? { ...layer.crop } : null,
      grid: { ...layer.grid },
    })),
    activeReferenceLayerId: snapshot.activeReferenceLayerId,
    board: updatePixelCanvasOnBoard(project.board, snapshot.canvasId, {
      width: snapshot.canvasWidth,
      height: snapshot.canvasHeight,
      layers: cloneLayers(snapshot.layers),
      activeLayerId: snapshot.activeLayerId,
    }),
  });
}

export function applyBoardStructureSnapshot(
  project: Project,
  snapshot: Extract<EditorSnapshot, { kind: "board" }>,
): Project {
  return touchProject(
    withBoard(project, {
      canvases: clonePixelCanvases(snapshot.canvases),
      activeCanvasId: snapshot.activeCanvasId,
      totalCanvasCount: snapshot.totalCanvasCount,
    }),
  );
}

function resolveFocusCanvasId(snapshot: EditorSnapshot): string | null {
  if (snapshot.kind === "board") return snapshot.activeCanvasId;
  return snapshot.canvasId;
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
    focusCanvasId: resolveFocusCanvasId(restored),
    structural: restored.kind === "structure" || restored.kind === "board",
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
    focusCanvasId: resolveFocusCanvasId(restored),
    structural: restored.kind === "structure" || restored.kind === "board",
  };
}

export function restoreLayerPixelsFromSnapshot(
  project: Project,
  layerId: string,
  pixels: Uint32Array,
  canvasId?: string,
): Project {
  const targetCanvasId = canvasId ?? getActiveCanvas(project).id;
  const canvas = project.board.canvases.find((c) => c.id === targetCanvasId);
  if (!canvas) return project;

  const layerIndex = canvas.layers.findIndex((l) => l.id === layerId);
  if (layerIndex < 0) return project;

  const layer = canvas.layers[layerIndex];
  if (!isDrawingLayer(layer)) return project;

  const grid = getLayerGrid({ ...layer, pixels: new Uint32Array(pixels) });
  const updatedLayer = syncLayerPixels(layer, grid);

  const layers = [...canvas.layers];
  layers[layerIndex] = updatedLayer;

  return touchProject({
    ...project,
    board: updatePixelCanvasOnBoard(project.board, targetCanvasId, { layers }),
  });
}

export { cloneEditorSnapshot };
