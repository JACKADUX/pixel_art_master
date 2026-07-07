import { useEffect } from "react";
import { isSelectionEmpty } from "@/domain/selection/SelectionState";
import {
  selectionModeFromShortcutCode,
  toolFromShortcutCode,
} from "../config/toolShortcuts";
import { useAppStore } from "../stores/appStore";
import { usePixelRestoreStore } from "../stores/pixelRestoreStore";
import { focusCanvasKeyboard } from "../utils/canvasKeyboardFocus";
import {
  installGlobalFocusRelease,
  isTextEntryElement,
  shouldDeferShortcutToTextEntry,
} from "../utils/editableFocus";

export function useAppShortcuts() {
  useEffect(() => {
    const teardownFocus = installGlobalFocusRelease(focusCanvasKeyboard);
    const handleWindowFocus = () => {
      if (isTextEntryElement(document.activeElement)) return;
      focusCanvasKeyboard();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (isTextEntryElement(document.activeElement)) return;
      focusCanvasKeyboard();
    };
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      teardownFocus();
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldDeferShortcutToTextEntry(event)) return;

      const pixelRestore = usePixelRestoreStore.getState();
      if (pixelRestore.open) {
        if (
          pixelRestore.restoreMode === "gridScale" &&
          ((pixelRestore.gridScaleType === "singleCell" && pixelRestore.gridSeedCell) ||
            (pixelRestore.gridScaleType === "region" && pixelRestore.gridRegion)) &&
          (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) ||
            event.key === "Enter")
        ) {
          return;
        }
      }

      const store = useAppStore.getState();
      const capturePhase = store.assetCapturePhase;

      if (capturePhase === "adjusting") {
        if (event.key === "Escape") {
          event.preventDefault();
          store.cancelAssetCanvasCapture();
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          void store.confirmAssetCanvasCapture();
          return;
        }
        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (arrowKeys.includes(event.key)) {
          event.preventDefault();
          const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
          const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
          const corner = event.shiftKey ? "bottomRight" : "topLeft";
          store.adjustAssetCaptureRect(dx, dy, corner);
          return;
        }
        return;
      }

      if (capturePhase === "dragging" && event.key === "Escape") {
        event.preventDefault();
        store.cancelAssetCanvasCapture();
        return;
      }

      if (store.tileSession.phase === "creating" && event.key === "Escape") {
        event.preventDefault();
        store.cancelTileRegionCreate();
        return;
      }

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

      if (ctrl && (event.key === "b" || event.key === "B")) {
        event.preventDefault();
        void store.createPatternBrushFromSelection();
        return;
      }

      if (ctrl && (event.key === "c" || event.key === "C")) {
        const layerPanelActive =
          store.activeRegion === "layers" && store.layersPanelTab === "drawing";
        if (layerPanelActive) {
          event.preventDefault();
          store.copyDrawingLayer();
          return;
        }
        if (!hasSelection) return;
        event.preventDefault();
        void store.copySelection();
        return;
      }

      if (ctrl && (event.key === "x" || event.key === "X")) {
        if (!hasSelection) return;
        event.preventDefault();
        void store.cutSelection();
        return;
      }

      if (ctrl && (event.key === "v" || event.key === "V")) {
        if (usePixelRestoreStore.getState().open) return;
        const currentStore = useAppStore.getState();
        if (
          currentStore.layersPanelTab === "reference" &&
          currentStore.activeRegion === "layers" &&
          !shouldDeferShortcutToTextEntry(event)
        ) {
          event.preventDefault();
          void currentStore.importReferenceLayerFromClipboardAction();
          return;
        }
        if (
          currentStore.activeRegion === "assetLibrary" &&
          !shouldDeferShortcutToTextEntry(event)
        ) {
          event.preventDefault();
          void currentStore.importAssetFromClipboardAction();
          return;
        }
        if (
          currentStore.activeRegion === "layers" &&
          currentStore.layersPanelTab === "drawing"
        ) {
          event.preventDefault();
          currentStore.pasteDrawingLayer();
          return;
        }
        event.preventDefault();
        void store.pasteSelection();
        return;
      }

      if (ctrl && (event.key === "t" || event.key === "T")) {
        event.preventDefault();
        store.activateTransformTool();
        return;
      }

      if (ctrl && (event.key === "'" || event.code === "Quote" || event.key === "2")) {
        if (store.project) {
          event.preventDefault();
          store.toggleGrid();
        }
        return;
      }

      if (ctrl && event.key === "1") {
        event.preventDefault();
        store.toggleCanvasDisplayMode();
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

      if (!ctrl) {
        const selectionMode = selectionModeFromShortcutCode(event.code);
        if (selectionMode) {
          event.preventDefault();
          store.setActiveTool("select");
          store.setToolSettings({ selectionMode });
          return;
        }

        if (event.code === "KeyF") {
          if (pixelRestore.open || !store.project || store.cropEditorLayerId) return;
          event.preventDefault();
          store.requestFitActiveCanvasInViewport();
          return;
        }

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
        void store.newProject();
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

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
