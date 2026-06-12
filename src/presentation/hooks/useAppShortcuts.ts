import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useAppShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const store = useAppStore.getState();
      const ctrl = event.ctrlKey || event.metaKey;

      if (ctrl && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        if (event.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
        return;
      }

      if (ctrl && (event.key === "y" || event.key === "Y")) {
        event.preventDefault();
        store.redo();
        return;
      }

      if (ctrl && (event.key === "a" || event.key === "A")) {
        event.preventDefault();
        store.selectAllCanvas();
        return;
      }

      if (ctrl && (event.key === "d" || event.key === "D")) {
        event.preventDefault();
        store.deselectCanvas();
        return;
      }

      if (ctrl && event.shiftKey && (event.key === "i" || event.key === "I")) {
        event.preventDefault();
        store.invertCanvasSelection();
        return;
      }

      if (ctrl && (event.key === "c" || event.key === "C")) {
        event.preventDefault();
        void store.copySelection();
        return;
      }

      if (ctrl && (event.key === "x" || event.key === "X")) {
        event.preventDefault();
        void store.cutSelection();
        return;
      }

      if (ctrl && (event.key === "v" || event.key === "V")) {
        event.preventDefault();
        void store.pasteSelection();
        return;
      }

      if (ctrl && (event.key === "t" || event.key === "T")) {
        event.preventDefault();
        store.setActiveTool("transform");
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        store.cancelSelection();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        store.commitSelection();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        store.clearSelectionContent();
        return;
      }

      if (event.key === "[") {
        event.preventDefault();
        store.rotateSelection90(-1);
        return;
      }

      if (event.key === "]") {
        event.preventDefault();
        store.rotateSelection90(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        store.nudgeSelectionBy(0, event.shiftKey ? -10 : -1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        store.nudgeSelectionBy(0, event.shiftKey ? 10 : 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        store.nudgeSelectionBy(event.shiftKey ? -10 : -1, 0);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        store.nudgeSelectionBy(event.shiftKey ? 10 : 1, 0);
        return;
      }

      if (!ctrl) return;

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store.newProject();
        return;
      }

      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        void store.openProject();
        return;
      }

      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (event.shiftKey) {
          void store.saveProjectAs();
        } else {
          void store.saveCurrentProject();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
