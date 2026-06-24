import { useWorkspaceRegion } from "../hooks/useWorkspaceRegion";
import { LayersSection } from "./LayersSection";
import { PalettePanel } from "./PalettePanel";
import { ResizableSidebar } from "./ResizableSidebar";
import { VerticalSplitPane } from "./VerticalSplitPane";
import { WorkspaceRegionBorder } from "./WorkspaceRegionBorder";

export function RightPanel() {
  const { regionProps: paletteRegionProps, isActive: paletteRegionActive } =
    useWorkspaceRegion("palette");

  return (
    <ResizableSidebar>
      <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-l border-zinc-700 bg-zinc-900">
        <VerticalSplitPane
          top={
            <div
              {...paletteRegionProps}
              className="relative flex min-h-0 min-w-0 w-full flex-1 overflow-hidden"
            >
              <WorkspaceRegionBorder active={paletteRegionActive} />
              <PalettePanel />
            </div>
          }
          bottom={<LayersSection />}
        />
      </aside>
    </ResizableSidebar>
  );
}
