import { useEffect } from "react";
import { AssetLibraryModal } from "./presentation/components/asset/AssetLibraryModal";
import { AssetLibraryDrawer } from "./presentation/components/asset/AssetLibraryDrawer";
import { CanvasView } from "./presentation/components/CanvasView";
import { RightPanel } from "./presentation/components/RightPanel";
import { StatusBar } from "./presentation/components/StatusBar";
import { Toolbar } from "./presentation/components/Toolbar";
import { ToolPropertiesBar } from "./presentation/components/ToolPropertiesBar";
import { ProjectManagerModal } from "./presentation/components/ProjectManagerModal";
import { CanvasSizeModal } from "./presentation/components/CanvasSizeModal";
import { ExportImageModal } from "./presentation/components/ExportImageModal";
import { PixelRestorePage } from "./presentation/components/pixelRestore/PixelRestorePage";
import { ColorEditPage } from "./presentation/components/colorEdit/ColorEditPage";
import { WorldCreatorPage } from "./presentation/components/world/WorldCreatorPage";
import { ComfyUiPage } from "./presentation/components/comfyui/ComfyUiPage";
import { SettingsModal } from "./presentation/components/settings/SettingsModal";
import { AiTextFieldHost } from "./presentation/components/aiTextField/AiTextFieldHost";
import { ToastContainer } from "./presentation/components/ToastContainer";
import { TopBar } from "./presentation/components/TopBar";
import { useAppShortcuts } from "./presentation/hooks/useAppShortcuts";
import { useAutoSaveProject } from "./presentation/hooks/useAutoSaveProject";
import { useWorkspaceRegionAutoClear } from "./presentation/hooks/useWorkspaceRegion";
import { useAppStore } from "./presentation/stores/appStore";
import "./App.css";

function App() {
  useAppShortcuts();
  useAutoSaveProject();
  useWorkspaceRegionAutoClear();
  const init = useAppStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <TopBar />
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)_auto] overflow-hidden">
        <Toolbar />
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <ToolPropertiesBar />
          <CanvasView />
          <AssetLibraryDrawer />
        </div>
        <RightPanel />
      </div>
      <StatusBar />
      <ProjectManagerModal />
      <AssetLibraryModal />
      <CanvasSizeModal />
      <ExportImageModal />
      <SettingsModal />
      <PixelRestorePage />
      <ColorEditPage />
      <WorldCreatorPage />
      <ComfyUiPage />
      <AiTextFieldHost />
      <ToastContainer />
    </div>
  );
}

export default App;
