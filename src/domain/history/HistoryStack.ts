import type { SelectionState } from "../selection/SelectionState";
import { cloneSelectionState } from "../selection/SelectionState";

export interface HistoryEntry {
  layerId: string;
  pixels: Uint32Array;
  selection: SelectionState | null;
}

export interface EditorSnapshot {
  layerId: string;
  pixels: Uint32Array;
  selection: SelectionState | null;
}

export function cloneEditorSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    layerId: snapshot.layerId,
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

  get undoDepth(): number {
    return this.undoStack.length;
  }
}
