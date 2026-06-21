import { useAppStore } from "../stores/appStore";
import { ensureTauriWindowFocus } from "@/infrastructure/tauri/TauriWindowService";
import { releaseKeyboardFocus } from "./editableFocus";

/** Blur text inputs and focus the canvas viewport so global shortcuts stay active. */
export function focusCanvasKeyboard(): void {
  releaseKeyboardFocus();
  useAppStore.getState().viewportContainer?.focus({ preventScroll: true });
  void ensureTauriWindowFocus();
}
