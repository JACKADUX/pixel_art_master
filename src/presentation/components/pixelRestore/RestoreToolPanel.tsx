import { useEffect, useState } from "react";
import { FixedScaleControls } from "./FixedScaleControls";
import { GridScaleControls } from "./GridScaleControls";
import type { RestoreMode } from "../../stores/pixelRestoreStore";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";

interface RestoreToolPanelProps {
  canExport: boolean;
  canSendToColorEdit: boolean;
  onExport: () => void;
  onSendToColorEdit: () => void;
}

export function RestoreToolPanel({
  canExport,
  canSendToColorEdit,
  onExport,
  onSendToColorEdit,
}: RestoreToolPanelProps) {
  const restoreMode = usePixelRestoreStore((s) => s.restoreMode);
  const setRestoreMode = usePixelRestoreStore((s) => s.setRestoreMode);
  const detectedScale = usePixelRestoreStore((s) => s.detectedScale);
  const selectedScale = usePixelRestoreStore((s) => s.selectedScale);
  const sourceImageData = usePixelRestoreStore((s) => s.sourceImageData);
  const error = usePixelRestoreStore((s) => s.error);
  const setScale = usePixelRestoreStore((s) => s.setScale);

  const [activeTab, setActiveTab] = useState<RestoreMode>(restoreMode);

  useEffect(() => {
    setActiveTab(restoreMode);
  }, [restoreMode]);

  const handleTabChange = (mode: RestoreMode) => {
    setActiveTab(mode);
    setRestoreMode(mode);
  };

  const sourceWidth = sourceImageData?.width ?? 0;
  const sourceHeight = sourceImageData?.height ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex border-b border-zinc-800">
        <button
          type="button"
          onClick={() => handleTabChange("fixedScale")}
          className={`flex-1 px-3 py-2 text-xs ${
            activeTab === "fixedScale"
              ? "border-b-2 border-blue-500 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          固定缩放
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("gridScale")}
          className={`flex-1 px-3 py-2 text-xs ${
            activeTab === "gridScale"
              ? "border-b-2 border-blue-500 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          网格缩放
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === "fixedScale" ? (
          <FixedScaleControls
            detectedScale={detectedScale}
            selectedScale={selectedScale}
            sourceWidth={sourceWidth}
            sourceHeight={sourceHeight}
            error={error}
            canExport={canExport}
            canSendToColorEdit={canSendToColorEdit}
            onScaleChange={setScale}
            onExport={onExport}
            onSendToColorEdit={onSendToColorEdit}
          />
        ) : (
          <GridScaleControls
            canExport={canExport}
            canSendToColorEdit={canSendToColorEdit}
            onExport={onExport}
            onSendToColorEdit={onSendToColorEdit}
          />
        )}
      </div>
    </div>
  );
}
