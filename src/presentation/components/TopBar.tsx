import { useMemo, useState } from "react";
import { isRecoveryPath } from "@/infrastructure/storage/RecoveryPath";
import { buildMenuGroups } from "../config/menuConfig";
import { useAppStore } from "../stores/appStore";
import { MenuBar } from "./MenuBar";
import { WindowPicker } from "./WindowPicker";

export function TopBar() {
  const newProject = useAppStore((s) => s.newProject);
  const openProject = useAppStore((s) => s.openProject);
  const saveCurrentProject = useAppStore((s) => s.saveCurrentProject);
  const saveProjectAs = useAppStore((s) => s.saveProjectAs);
  const screenCapture = useAppStore((s) => s.screenCapture);
  const windowCapture = useAppStore((s) => s.windowCapture);
  const importImage = useAppStore((s) => s.importImage);
  const openProjectManager = useAppStore((s) => s.openProjectManager);
  const toggleAlwaysOnTop = useAppStore((s) => s.toggleAlwaysOnTop);
  const alwaysOnTop = useAppStore((s) => s.alwaysOnTop);
  const project = useAppStore((s) => s.project);

  const [pickerOpen, setPickerOpen] = useState(false);

  const menus = useMemo(
    () =>
      buildMenuGroups({
        newProject,
        openProject: () => void openProject(),
        saveCurrentProject: () => void saveCurrentProject(),
        saveProjectAs: () => void saveProjectAs(),
        importImage: () => void importImage(),
        openProjectManager,
        screenCapture: () => void screenCapture(),
        openWindowPicker: () => setPickerOpen(true),
        toggleAlwaysOnTop: () => void toggleAlwaysOnTop(),
        alwaysOnTop,
      }),
    [
      newProject,
      openProject,
      saveCurrentProject,
      saveProjectAs,
      importImage,
      openProjectManager,
      screenCapture,
      toggleAlwaysOnTop,
      alwaysOnTop,
    ],
  );

  const saveLabel = (() => {
    if (!project) return "";
    if (!project.filePath) return " (未保存)";
    if (isRecoveryPath(project.filePath)) return " (自动保存)";
    return "";
  })();

  return (
    <>
      <header className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-900 px-3 py-2">
        <span className="mr-3 text-sm font-semibold text-zinc-100">PixelArt Master</span>
        <MenuBar menus={menus} />

        {project && (
          <span className="ml-auto truncate text-xs text-zinc-500">
            {project.name}
            {saveLabel}
          </span>
        )}
      </header>

      <WindowPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={windowCapture}
      />
    </>
  );
}
