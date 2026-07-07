import type { Layer, LayerPosition } from "../layer/Layer";
import { cloneLayers } from "../layer/Layer";
import type { SelectionState } from "../selection/SelectionState";
import { cloneSelectionState } from "../selection/SelectionState";

export type SnapshotKind = "pixels" | "structure";

/** 单个绘制层像素的快照，用于绘制、选区等只改变像素的操作。 */
export interface PixelSnapshot {
  kind: "pixels";
  layerId: string;
  width: number;
  height: number;
  position: LayerPosition;
  pixels: Uint32Array;
  selection: SelectionState | null;
}

/** 整个图层结构的快照，用于增删、排序、画布尺寸等改变图层列表或画布维度的操作。 */
export interface StructureSnapshot {
  kind: "structure";
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  activeLayerId: string;
  activeReferenceLayerId: string | null;
  selection: SelectionState | null;
}

export type EditorSnapshot = PixelSnapshot | StructureSnapshot;
export type HistoryEntry = EditorSnapshot;

function isStructureSnapshot(snapshot: EditorSnapshot): snapshot is StructureSnapshot {
  return snapshot.kind === "structure";
}

export function cloneEditorSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  if (isStructureSnapshot(snapshot)) {
    return {
      kind: "structure",
      canvasWidth: snapshot.canvasWidth,
      canvasHeight: snapshot.canvasHeight,
      layers: cloneLayers(snapshot.layers),
      activeLayerId: snapshot.activeLayerId,
      activeReferenceLayerId: snapshot.activeReferenceLayerId,
      selection: snapshot.selection ? cloneSelectionState(snapshot.selection) : null,
    };
  }
  return {
    kind: "pixels",
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

  /** 下一个待撤销条目，调用方据此采集匹配条目所指向图层的当前状态。 */
  get nextUndoEntry(): HistoryEntry | null {
    return this.undoStack.length > 0
      ? this.undoStack[this.undoStack.length - 1]
      : null;
  }

  /** 下一个待重做条目，调用方据此采集匹配条目所指向图层的当前状态。 */
  get nextRedoEntry(): HistoryEntry | null {
    return this.redoStack.length > 0
      ? this.redoStack[this.redoStack.length - 1]
      : null;
  }

  /** 下一个待撤销条目的类型，调用方据此采集匹配类型的当前状态。 */
  get nextUndoKind(): SnapshotKind | null {
    return this.nextUndoEntry?.kind ?? null;
  }

  /** 下一个待重做条目的类型，调用方据此采集匹配类型的当前状态。 */
  get nextRedoKind(): SnapshotKind | null {
    return this.nextRedoEntry?.kind ?? null;
  }

  get undoDepth(): number {
    return this.undoStack.length;
  }
}
