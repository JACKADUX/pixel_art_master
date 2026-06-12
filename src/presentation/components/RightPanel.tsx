import { useAppStore } from "../stores/appStore";

import { LayersPanel } from "./LayersPanel";

import { NotesPanel } from "./NotesPanel";

import { PalettePanel } from "./PalettePanel";

import { ResizableSidebar } from "./ResizableSidebar";
import { VerticalSplitPane } from "./VerticalSplitPane";

export function RightPanel() {
  const rightPanelTab = useAppStore((s) => s.rightPanelTab);
  const setRightPanelTab = useAppStore((s) => s.setRightPanelTab);

  return (
    <ResizableSidebar>
      <aside className="flex h-full min-h-0 flex-1 flex-col border-l border-zinc-700 bg-zinc-900">
        <VerticalSplitPane
        top={
          <>
            <div className="flex shrink-0 border-b border-zinc-700">
              <button
                type="button"
                onClick={() => setRightPanelTab("palette")}
                className={`flex-1 py-2 text-xs font-medium ${
                  rightPanelTab === "palette"
                    ? "border-b-2 border-blue-500 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                色板
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("notes")}
                className={`flex-1 py-2 text-xs font-medium ${
                  rightPanelTab === "notes"
                    ? "border-b-2 border-blue-500 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                笔记
              </button>
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {rightPanelTab === "palette" && <PalettePanel />}
              {rightPanelTab === "notes" && <NotesPanel />}
            </div>
          </>
        }
        bottom={<LayersPanel />}
        />
      </aside>
    </ResizableSidebar>
  );
}
