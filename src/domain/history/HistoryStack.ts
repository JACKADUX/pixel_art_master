import type { Layer, LayerPosition, ReferenceLayer } from "../layer/Layer";
import { cloneLayers } from "../layer/Layer";
import type { SelectionState } from "../selection/SelectionState";
import { cloneSelectionState } from "../selection/SelectionState";
import type { PixelCanvas } from "../pixelCanvas/PixelCanvas";
import { clonePixelCanvases } from "../pixelCanvas/PixelCanvasClone";

export type SnapshotKind = "pixels" | "structure" | "board";

/** 单个绘制层像素的快照，用于绘制、选区等只改变像素的操作。 */
export interface PixelSnapshot {
  kind: "pixels";
  canvasId: string;
  layerId: string;
  width: number;
  height: number;
  position: LayerPosition;
  pixels: Uint32Array;
  selection: SelectionState | null;
}

/** 画板内图层结构的快照，用于增删、排序、画板尺寸等操作。 */
export interface StructureSnapshot {
  kind: "structure";
  canvasId: string;
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  activeLayerId: string;
  referenceLayers: ReferenceLayer[];
  activeReferenceLayerId: string | null;
  selection: SelectionState | null;
}

/** 工作区画板结构的快照，用于新增/删除/移动画板。 */
export interface BoardStructureSnapshot {
  kind: "board";
  canvases: PixelCanvas[];
  activeCanvasId: string;
  totalCanvasCount: number;
  selection: SelectionState | null;
}

export type EditorSnapshot = PixelSnapshot | StructureSnapshot | BoardStructureSnapshot;
export type HistoryEntry = EditorSnapshot;

function isStructureSnapshot(snapshot: EditorSnapshot): snapshot is StructureSnapshot {
  return snapshot.kind === "structure";
}

function isBoardStructureSnapshot(snapshot: EditorSnapshot): snapshot is BoardStructureSnapshot {
  return snapshot.kind === "board";
}

export function cloneEditorSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  if (isBoardStructureSnapshot(snapshot)) {
    return {
      kind: "board",
      canvases: clonePixelCanvases(snapshot.canvases),
      activeCanvasId: snapshot.activeCanvasId,
      totalCanvasCount: snapshot.totalCanvasCount,
      selection: snapshot.selection ? cloneSelectionState(snapshot.selection) : null,
    };
  }
  if (isStructureSnapshot(snapshot)) {
    return {
      kind: "structure",
      canvasId: snapshot.canvasId,
      canvasWidth: snapshot.canvasWidth,
      canvasHeight: snapshot.canvasHeight,
      layers: cloneLayers(snapshot.layers),
      activeLayerId: snapshot.activeLayerId,
      referenceLayers: snapshot.referenceLayers.map((layer) => ({
        ...layer,
        position: { ...layer.position },
        crop: layer.crop ? { ...layer.crop } : null,
        grid: { ...layer.grid },
      })),
      activeReferenceLayerId: snapshot.activeReferenceLayerId,
      selection: snapshot.selection ? cloneSelectionState(snapshot.selection) : null,
    };
  }
  return {
    kind: "pixels",
    canvasId: snapshot.canvasId,
    layerId: snapshot.layerId,
    width: snapshot.width,
    height: snapshot.height,
    position: { ...snapshot.position },
    pixels: new Uint32Array(snapshot.pixels),
    selection: snapshot.selection ? cloneSelectionState(snapshot.selection) : null,
  };
}

export function entryToSnapshot(entry: HistoryEntry): EditorSnapshot {
  return cloneEditorSnapshot(entry);
}

export function snapshotToEntry(snapshot: EditorSnapshot): HistoryEntry {
  return cloneEditorSnapshot(snapshot);
}

const MAX_HISTORY = 100;

export class HistoryStack {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  push(entry: HistoryEntry): void {
    this.undoStack.push(cloneEditorSnapshot(entry));
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(current: EditorSnapshot): EditorSnapshot | null {
    if (this.undoStack.length === 0) return null;
    const entry = this.undoStack.pop()!;
    this.redoStack.push(cloneEditorSnapshot(current));
    return entryToSnapshot(entry);
  }

  redo(current: EditorSnapshot): EditorSnapshot | null {
    if (this.redoStack.length === 0) return null;
    const entry = this.redoStack.pop()!;
    this.undoStack.push(cloneEditorSnapshot(current));
    return entryToSnapshot(entry);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get nextUndoEntry(): HistoryEntry | null {
    return this.undoStack.length > 0
      ? this.undoStack[this.undoStack.length - 1]
      : null;
  }

  get nextRedoEntry(): HistoryEntry | null {
    return this.redoStack.length > 0
      ? this.redoStack[this.redoStack.length - 1]
      : null;
  }

  get nextUndoKind(): SnapshotKind | null {
    return this.nextUndoEntry?.kind ?? null;
  }

  get nextRedoKind(): SnapshotKind | null {
    return this.nextRedoEntry?.kind ?? null;
  }

  get undoDepth(): number {
    return this.undoStack.length;
  }
}
