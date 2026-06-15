import { OklabMergeControls } from "./OklabMergeControls";

interface ColorEditToolPanelProps {
  canExport: boolean;
  onExport: () => void;
}

export function ColorEditToolPanel({ canExport, onExport }: ColorEditToolPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OklabMergeControls canExport={canExport} onExport={onExport} />
    </div>
  );
}
