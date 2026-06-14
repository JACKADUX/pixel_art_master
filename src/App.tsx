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
import { PixelRestorePage } from "./presentation/components/pixelRestore/PixelRestorePage";
import { ToastContainer } from "./presentation/components/ToastContainer";
import { TopBar } from "./presentation/components/TopBar";
import { useAppShortcuts } from "./presentation/hooks/useAppShortcuts";
import { useAppStore } from "./presentation/stores/appStore";
import "./App.css";

function App() {
  useAppShortcuts();
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
      <PixelRestorePage />
      <ToastContainer />
    </div>
  );
}

export default App;
