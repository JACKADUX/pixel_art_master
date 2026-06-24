import { useAppStore } from "../stores/appStore";
import { useWorkspaceRegion } from "../hooks/useWorkspaceRegion";

import { LayersPanel } from "./LayersPanel";
import { ReferenceLayersPanel } from "./ReferenceLayersPanel";
import { WorkspaceRegionBorder } from "./WorkspaceRegionBorder";

export function LayersSection() {
  const layersPanelTab = useAppStore((s) => s.layersPanelTab);
  const setLayersPanelTab = useAppStore((s) => s.setLayersPanelTab);
  const { regionProps, isActive: regionActive } = useWorkspaceRegion("layers");

  return (
    <div
      {...regionProps}
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col"
    >
      <WorkspaceRegionBorder active={regionActive} />
      <div className="flex shrink-0 border-b border-zinc-700">
        <button
          type="button"
          onClick={() => setLayersPanelTab("drawing")}
          className={`flex-1 py-2 text-xs font-medium ${
            layersPanelTab === "drawing"
              ? "border-b-2 border-blue-500 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          图层
        </button>
        <button
          type="button"
          onClick={() => setLayersPanelTab("reference")}
          className={`flex-1 py-2 text-xs font-medium ${
            layersPanelTab === "reference"
              ? "border-b-2 border-blue-500 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          参考层
        </button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {layersPanelTab === "drawing" && <LayersPanel />}
        {layersPanelTab === "reference" && <ReferenceLayersPanel />}
      </div>
    </div>
  );
}
