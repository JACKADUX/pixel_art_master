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
      if (!event.ctrlKey || isEditableTarget(event.target)) return;

      const store = useAppStore.getState();

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
