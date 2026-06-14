import { useEffect } from "react";
import { isSelectionEmpty } from "@/domain/selection/SelectionState";
import { toolFromShortcutCode } from "../config/toolShortcuts";
import { toast } from "../stores/toastStore";
import { useAppStore } from "../stores/appStore";
import { usePixelRestoreStore } from "../stores/pixelRestoreStore";
import {
  installGlobalFocusRelease,
  isTextEntryElement,
} from "../utils/editableFocus";

export function useAppShortcuts() {
  useEffect(() => installGlobalFocusRelease(), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryElement(document.activeElement)) return;

      const store = useAppStore.getState();
      const { selection } = store;
      const hasSelection = selection !== null && !isSelectionEmpty(selection);
      const hasFloatingSelection = selection?.floating != null;
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
        if (usePixelRestoreStore.getState().open) return;
        event.preventDefault();
        void store.pasteSelection();
        return;
      }

      if (ctrl && (event.key === "t" || event.key === "T")) {
        event.preventDefault();
        store.setActiveTool("transform");
        return;
      }

      if (!ctrl && event.shiftKey && (event.key === "h" || event.key === "H")) {
        event.preventDefault();
        store.flipSelectionHorizontal();
        return;
      }

      if (!ctrl && event.shiftKey && (event.key === "v" || event.key === "V")) {
        event.preventDefault();
        store.flipSelectionVertical();
        return;
      }

      if (!ctrl && !event.isComposing && event.keyCode !== 229) {
        const tool = toolFromShortcutCode(event.code);
        if (tool) {
          event.preventDefault();
          store.setActiveTool(tool);
          return;
        }
      }

      if (event.key === "Escape") {
        if (!hasSelection) return;
        event.preventDefault();
        store.cancelSelection();
        return;
      }

      if (event.key === "Enter") {
        if (!hasFloatingSelection) return;
        event.preventDefault();
        store.commitSelection();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (!hasSelection) return;
        event.preventDefault();
        store.clearSelectionContent();
        return;
      }

      if (event.key === "[") {
        if (!hasSelection) return;
        event.preventDefault();
        store.rotateSelection90(-1);
        return;
      }

      if (event.key === "]") {
        if (!hasSelection) return;
        event.preventDefault();
        store.rotateSelection90(1);
        return;
      }

      if (event.key === "ArrowUp") {
        if (!hasSelection) return;
        event.preventDefault();
        store.nudgeSelectionBy(0, event.shiftKey ? -10 : -1);
        return;
      }

      if (event.key === "ArrowDown") {
        if (!hasSelection) return;
        event.preventDefault();
        store.nudgeSelectionBy(0, event.shiftKey ? 10 : 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        if (!hasSelection) return;
        event.preventDefault();
        store.nudgeSelectionBy(event.shiftKey ? -10 : -1, 0);
        return;
      }

      if (event.key === "ArrowRight") {
        if (!hasSelection) return;
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
          void store.saveCurrentProject().then((saved) => {
            if (saved) {
              toast.info("保存成功");
            }
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
