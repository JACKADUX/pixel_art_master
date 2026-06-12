import { useEffect } from "react";
import { CanvasView } from "./presentation/components/CanvasView";
import { RightPanel } from "./presentation/components/RightPanel";
import { StatusBar } from "./presentation/components/StatusBar";
import { Toolbar } from "./presentation/components/Toolbar";
import { MonitorPicker } from "./presentation/components/MonitorPicker";
import { ProjectManagerModal } from "./presentation/components/ProjectManagerModal";
import { TopBar } from "./presentation/components/TopBar";
import { useAppShortcuts } from "./presentation/hooks/useAppShortcuts";
import { useAppStore } from "./presentation/stores/appStore";
import "./App.css";

function App() {
  useAppShortcuts();
  const init = useAppStore((s) => s.init);
  const monitorPickerOpen = useAppStore((s) => s.monitorPickerOpen);
  const availableMonitors = useAppStore((s) => s.availableMonitors);
  const closeMonitorPicker = useAppStore((s) => s.closeMonitorPicker);
  const captureMonitor = useAppStore((s) => s.captureMonitor);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <TopBar />
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)_auto] overflow-hidden">
        <Toolbar />
        <CanvasView />
        <RightPanel />
      </div>
      <StatusBar />
      <MonitorPicker
        open={monitorPickerOpen}
        monitors={availableMonitors}
        onClose={closeMonitorPicker}
        onSelect={captureMonitor}
      />
      <ProjectManagerModal />
    </div>
  );
}

export default App;
