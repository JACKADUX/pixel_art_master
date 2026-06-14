import { ColorMergeControls } from "./ColorMergeControls";

interface ColorEditToolPanelProps {
  canExport: boolean;
  onExport: () => void;
}

export function ColorEditToolPanel({ canExport, onExport }: ColorEditToolPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-zinc-800 px-3 py-2">
        <span className="text-xs font-medium text-zinc-200">颜色合并</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ColorMergeControls canExport={canExport} onExport={onExport} />
      </div>
    </div>
  );
}
